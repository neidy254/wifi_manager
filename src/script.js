const ESP32_IP = "http://192.168.4.1"; // Địa chỉ IP của ESP32 AP

document.addEventListener("DOMContentLoaded", function () {
  fetchWifiList(); // Tải danh sách WiFi khi trang được load

  document
    .getElementById("wifiForm")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Ngăn chặn form gửi theo cách truyền thống
      connectToWifi();
    });
});

function fetchWifiList() {
  var select = document.getElementById("ssid_select");
  var status = document.getElementById("status_message");
  select.innerHTML = '<option value="">-- Đang quét WiFi... --</option>';
  status.className = "";
  status.innerText = "Đang quét các mạng WiFi...";

  fetch(ESP32_IP + "/scan") // Gọi API quét WiFi của ESP32
    .then((response) => response.json())
    .then((data) => {
      select.innerHTML = '<option value="">-- Chọn mạng WiFi --</option>';
      if (data.length === 0) {
        status.className = "error";
        status.innerText = "Không tìm thấy mạng WiFi nào.";
        select.innerHTML = '<option value="">Không tìm thấy</option>';
      } else {
        status.className = "success";
        status.innerText = "Đã tìm thấy " + data.length + " mạng WiFi.";
        data.forEach((network) => {
          let option = document.createElement("option");
          option.value = network.ssid;
          let signalIcon; // Unicode for signal strength
          if (network.rssi > -50) signalIcon = "\uD83D\uDD8F";
          else if (network.rssi > -70) signalIcon = "\uD83D\uDD8E";
          else signalIcon = "\uD83D\uDD8D";
          option.innerText =
            network.ssid + " (" + signalIcon + " " + network.rssi + " dBm)";
          select.appendChild(option);
        });
      }
    })
    .catch((error) => {
      console.error("Lỗi khi fetch danh sách WiFi:", error);
      status.className = "error";
      status.innerText =
        "Lỗi khi tải danh sách WiFi. Đảm bảo bạn đã kết nối tới AP của ESP32 (" +
        ESP32_IP +
        ").";
      select.innerHTML = '<option value="">Lỗi tải</option>';
    });
}

function connectToWifi() {
  var ssidSelect = document.getElementById("ssid_select");
  var ssidInput = document.getElementById("ssid_input");
  var passwordInput = document.getElementById("password");
  var status = document.getElementById("status_message");

  let ssid = ssidSelect.value || ssidInput.value; // Ưu tiên chọn từ dropdown, sau đó là nhập thủ công
  let password = passwordInput.value;

  if (!ssid) {
    status.className = "error";
    status.innerText = "Vui lòng chọn hoặc nhập SSID.";
    return;
  }

  status.className = "";
  status.innerText = "Đang gửi cấu hình và kết nối WiFi...";

  fetch(ESP32_IP + "/connect", {
    // Gửi yêu cầu kết nối WiFi tới ESP32
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded", // Phải phù hợp với cách ESP32 parse
    },
    body: `ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(
      password
    )}`,
  })
    .then((response) => {
      if (response.ok) {
        status.className = "success";
        status.innerText =
          "Cấu hình đã gửi thành công. ESP32 đang kết nối. Vui lòng chờ và kiểm tra lại WiFi.";
        // Sau 5 giây, có thể chuyển hướng hoặc thông báo người dùng ngắt kết nối với AP
        setTimeout(() => {
          status.innerText =
            "Bây giờ bạn có thể ngắt kết nối khỏi mạng ESP32_SETUP và kiểm tra mạng WiFi của bạn.";
        }, 5000);
      } else {
        status.className = "error";
        status.innerText = "Lỗi khi gửi cấu hình. Vui lòng thử lại.";
      }
    })
    .catch((error) => {
      console.error("Lỗi khi gửi cấu hình:", error);
      status.className = "error";
      status.innerText =
        "Lỗi mạng khi gửi cấu hình. Đảm bảo bạn đã kết nối tới AP của ESP32 (" +
        ESP32_IP +
        ").";
    });
}

function refreshWifiList() {
  fetchWifiList();
}
