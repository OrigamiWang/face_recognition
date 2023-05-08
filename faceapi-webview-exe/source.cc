#include "webview.h"
#include "windows.h"

#ifdef _WIN32
int WINAPI WinMain(HINSTANCE hInt, HINSTANCE hPrevInst, LPSTR lpCmdLine,
                   int nCmdShow) {
#else
int main() {
#endif
  webview::webview w(false, nullptr);
  w.set_title("人脸识别");
  w.set_size(1080, 720, WEBVIEW_HINT_NONE);
	w.navigate("https://origamiwang.github.io/face_recognition/");

  w.run();
  return 0;
}
