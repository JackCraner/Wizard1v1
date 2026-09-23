package com.wizard1v1.app

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.BufferedInputStream
import java.net.Inet4Address
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.net.URLDecoder
import java.security.SecureRandom
import java.util.Collections
import java.util.UUID
import java.util.concurrent.*

/** Serves the bundled browser client and transports commands to the JS room authority. */
class LocalMultiplayerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var server: ServerSocket? = null
  private var workers: ThreadPoolExecutor? = null
  private var hotspot: WifiManager.LocalOnlyHotspotReservation? = null
  private var starting = false
  private var generation = 0
  private val pending = ConcurrentHashMap<String, CompletableFuture<String>>()
  private val main = Handler(Looper.getMainLooper())
  override fun getName() = "LocalMultiplayer"

  @ReactMethod fun start(useHotspot: Boolean, promise: Promise) {
    main.post {
      if (server != null || starting) { promise.reject("HOST_ACTIVE", "A room is already running."); return@post }
      try { context.assets.open("local-web/index.html").close() }
      catch (_: Exception) { promise.reject("WEB_MISSING", "This build has no browser client. Build with local-web assets first."); return@post }
      starting = true
      val current = ++generation
      if (!useHotspot) { beginServer(null, null, current, promise); return@post }
      try {
        val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        wifi.startLocalOnlyHotspot(object : WifiManager.LocalOnlyHotspotCallback() {
          override fun onStarted(reservation: WifiManager.LocalOnlyHotspotReservation) {
            if (current != generation) { reservation.close(); return }
            hotspot = reservation
            val ssid: String?
            val password: String?
            if (Build.VERSION.SDK_INT >= 30) {
              ssid = reservation.softApConfiguration.ssid
              password = reservation.softApConfiguration.passphrase
            } else {
              @Suppress("DEPRECATION") val configuration = reservation.wifiConfiguration
              ssid = configuration?.SSID
              password = configuration?.preSharedKey
            }
            // Interface assignment can finish just after the hotspot callback.
            beginServer(ssid, password, current, promise, 0)
          }
          override fun onFailed(reason: Int) {
            if (current != generation) return
            starting = false
            promise.reject("HOTSPOT_FAILED", "Could not start the hotspot ($reason). Turn off tethering, enable Wi-Fi/location if requested, or use existing Wi-Fi.")
          }
          override fun onStopped() {
            if (current != generation) return
            shutdown()
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("LocalMultiplayerStopped", "The hotspot stopped. Create a new room.")
          }
        }, main)
      } catch (error: Exception) { starting = false; promise.reject("HOTSPOT_FAILED", error.message, error) }
    }
  }

  private fun addresses(): List<Pair<String, String>> = Collections.list(NetworkInterface.getNetworkInterfaces()).flatMap { network ->
    if (!network.isUp || network.isLoopback) emptyList() else Collections.list(network.inetAddresses)
      .filter { it is Inet4Address && it.isSiteLocalAddress }
      .map { network.name to it.hostAddress!! }
  }

  private fun beginServer(ssid: String?, password: String?, current: Int, promise: Promise, attempt: Int = 0) {
    if (current != generation) return
    try {
      val addresses = addresses().sortedBy { (name, _) -> if (ssid != null && (name.contains("ap") || name.contains("swlan"))) 0 else 1 }.map { it.second }.distinct()
      if (addresses.isEmpty()) {
        if (ssid != null && attempt < 10) { main.postDelayed({ beginServer(ssid, password, current, promise, attempt + 1) }, 500); return }
        throw IllegalStateException("No local Wi-Fi address. Connect to Wi-Fi or create a hotspot first.")
      }
      val socket = ServerSocket(8787)
      val pool = ThreadPoolExecutor(4, 8, 30, TimeUnit.SECONDS, ArrayBlockingQueue(24))
      server = socket; workers = pool; starting = false
      context.currentActivity?.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      Thread({
        while (!socket.isClosed) {
          try {
            val connection = socket.accept()
            if (!connection.inetAddress.isSiteLocalAddress && !connection.inetAddress.isLoopbackAddress) { connection.close(); continue }
            try { pool.execute { serve(connection) } } catch (_: RejectedExecutionException) { connection.close() }
          } catch (_: Exception) { if (!socket.isClosed) break }
        }
      }, "WizardLocalHost").start()
      val info = Arguments.createMap().apply {
        putString("origin", "http://${addresses.first()}:8787")
        putArray("addresses", Arguments.fromList(addresses.map { "http://$it:8787" }))
        putString("hostToken", UUID.randomUUID().toString())
        putString("guestToken", UUID.randomUUID().toString())
        putString("invite", UUID.randomUUID().toString())
        putDouble("seed", (SecureRandom().nextInt().toLong() and 0xffffffffL).toDouble())
        if (ssid != null) putString("ssid", ssid)
        if (password != null) putString("password", password)
      }
      promise.resolve(info)
    } catch (error: Exception) { shutdown(); promise.reject("HOST_FAILED", error.message, error) }
  }

  private fun line(input: BufferedInputStream, limit: Int): String {
    val bytes = ArrayList<Byte>()
    while (bytes.size <= limit) {
      val next = input.read()
      if (next < 0) throw IllegalArgumentException("Incomplete request")
      if (next == 10) return bytes.toByteArray().toString(Charsets.US_ASCII).trimEnd('\r')
      bytes.add(next.toByte())
    }
    throw IllegalArgumentException("Header too large")
  }
  private fun serve(socket: Socket) {
    socket.use {
      try {
        socket.soTimeout = 10000
        val input = BufferedInputStream(socket.getInputStream())
        val request = line(input, 2048).split(' ')
        require(request.size == 3)
        val headers = mutableMapOf<String, String>()
        var total = 0
        while (true) {
          val header = line(input, 4096); if (header.isEmpty()) break
          total += header.length; require(total <= 8192)
          val split = header.indexOf(':'); require(split > 0)
          val key = header.substring(0, split).lowercase(); require(!headers.containsKey(key))
          headers[key] = header.substring(split + 1).trim()
        }
        if (request[0] == "POST" && request[1] == "/api/room") {
          require(headers["content-type"]?.startsWith("application/json") == true)
          require(!headers.containsKey("transfer-encoding"))
          val origin = headers["origin"]
          require(origin == null || origin == "http://${headers["host"]}")
          val length = headers["content-length"]?.toInt() ?: 0; require(length in 1..16384)
          val body = ByteArray(length)
          var offset = 0
          while (offset < length) { val read = input.read(body, offset, length - offset); require(read > 0); offset += read }
          val id = UUID.randomUUID().toString()
          val response = CompletableFuture<String>(); pending[id] = response
          try {
            val event = Arguments.createMap().apply { putString("id", id); putString("body", body.toString(Charsets.UTF_8)) }
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("LocalMultiplayerRequest", event)
            write(socket, 200, "application/json", response.get(10, TimeUnit.SECONDS).toByteArray(Charsets.UTF_8))
          } finally { pending.remove(id) }
        } else if (request[0] == "GET") {
          val path = URLDecoder.decode(request[1].substringBefore('?'), "UTF-8").removePrefix("/").ifEmpty { "index.html" }
          require(!path.contains("..") && !path.contains('\\') && !path.contains('\u0000'))
          val mime = when (path.substringAfterLast('.').lowercase()) {
            "html" -> "text/html; charset=utf-8"; "js" -> "application/javascript"; "css" -> "text/css"
            "json" -> "application/json"; "png" -> "image/png"; "jpg", "jpeg" -> "image/jpeg"; "webp" -> "image/webp"
            "svg" -> "image/svg+xml"; "ttf" -> "font/ttf"; "woff2" -> "font/woff2"; else -> "application/octet-stream"
          }
          try {
            context.assets.open("local-web/$path").use { asset ->
              val output = socket.getOutputStream()
              output.write("HTTP/1.1 200 OK\r\nContent-Type: $mime\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\n\r\n".toByteArray())
              asset.copyTo(output); output.flush()
            }
          } catch (_: java.io.FileNotFoundException) { write(socket, 404, "text/plain", "Not found".toByteArray()) }
        } else write(socket, 405, "text/plain", "Method not allowed".toByteArray())
      } catch (_: Exception) { try { write(socket, 400, "application/json", "{\"ok\":false,\"error\":\"Host unavailable or invalid request. Keep the host app open.\"}".toByteArray()) } catch (_: Exception) {} }
    }
  }
  private fun write(socket: Socket, status: Int, mime: String, bytes: ByteArray) {
    val output = socket.getOutputStream()
    output.write("HTTP/1.1 $status Response\r\nContent-Type: $mime\r\nContent-Length: ${bytes.size}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n".toByteArray())
    output.write(bytes); output.flush()
  }
  @ReactMethod fun respond(id: String, response: String) { pending[id]?.complete(response) }
  @ReactMethod fun stop(promise: Promise) { main.post { shutdown(); promise.resolve(null) } }
  private fun shutdown() {
    generation++; starting = false
    try { server?.close() } catch (_: Exception) {}
    server = null; workers?.shutdownNow(); workers = null
    pending.values.forEach { it.cancel(true) }; pending.clear()
    val reservation = hotspot; hotspot = null; reservation?.close()
    context.currentActivity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }
  override fun invalidate() { main.post { shutdown() }; super.invalidate() }
}
