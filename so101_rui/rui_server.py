"""
so101_rui · rui_server.py
==========================
ROS2 Jazzy node that:
  1. Serves the static web/ RUI over HTTP (default port 8765).
  2. Exposes publishers / subscribers so the ROS2 graph stays clean:
       - /so101/joint_commands   (std_msgs/Float64MultiArray)
       - /so101/enable_motors    (std_srvs/SetBool)  ← service proxy
  3. Subscribes to /joint_states — rosbridge relays this to the browser.

The browser connects directly to rosbridge (ws://localhost:9090) for
low-latency real-time messaging.  This node is purely for:
  • serving the static files
  • keeping named publishers/subscribers visible in the ROS graph

Usage:
    ros2 launch so101_rui rui.launch.py
    # then open http://localhost:8765
"""

import os
import threading
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float64, Float64MultiArray
from sensor_msgs.msg import JointState
from http.server import HTTPServer, BaseHTTPRequestHandler

WEB_DIR = os.path.join(os.path.dirname(__file__), 'web')

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.ico':  'image/x-icon',
    '.svg':  'image/svg+xml',
}


class StaticHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        url_path = self.path.split('?')[0]
        if url_path == '/':
            url_path = '/index.html'

        abs_path = os.path.realpath(os.path.join(WEB_DIR, url_path.lstrip('/')))
        if not abs_path.startswith(os.path.realpath(WEB_DIR)):
            self._send(403, 'text/plain', b'Forbidden')
            return
        if not os.path.isfile(abs_path):
            self._send(404, 'text/plain', b'Not found')
            return

        ext = os.path.splitext(abs_path)[1].lower()
        mime = MIME.get(ext, 'application/octet-stream')
        with open(abs_path, 'rb') as f:
            self._send(200, mime, f.read())

    def _send(self, code, content_type, body):
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


class RuiServerNode(Node):
    def __init__(self):
        super().__init__('so101_rui_server')

        self.declare_parameter('http_port', 8765)
        port = self.get_parameter('http_port').get_parameter_value().integer_value

        self.joint_pub   = self.create_publisher(Float64MultiArray, '/so101/joint_commands', 10)
        self.joint_sub   = self.create_subscription(
            JointState, '/joint_states', lambda msg: None, 10)

        server = HTTPServer(('0.0.0.0', port), StaticHandler)
        threading.Thread(target=server.serve_forever, daemon=True).start()

        self.get_logger().info(
            f'\n'
            f'  ╔═══════════════════════════════════════╗\n'
            f'  ║  SO-101 Robot User Interface (RUI)    ║\n'
            f'  ║  http://localhost:{port:<20}║\n'
            f'  ╚═══════════════════════════════════════╝\n'
            f'  Serving: {WEB_DIR}'
        )


def main(args=None):
    rclpy.init(args=args)
    node = RuiServerNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
