"""
ros2 launch so101_rui rui.launch.py
ros2 launch so101_rui rui.launch.py http_port:=8080 ws_port:=9090
"""

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        DeclareLaunchArgument('http_port', default_value='8765',
                              description='Port for the RUI HTTP server'),
        DeclareLaunchArgument('ws_port',   default_value='9090',
                              description='Port for the rosbridge WebSocket server'),

        Node(
            package='rosbridge_server',
            executable='rosbridge_websocket',
            name='rosbridge_websocket',
            parameters=[{'port': LaunchConfiguration('ws_port')}],
            output='screen',
        ),
        Node(
            package='so101_rui',
            executable='rui_server',
            name='so101_rui_server',
            parameters=[{'http_port': LaunchConfiguration('http_port')}],
            output='screen',
        ),
    ])
