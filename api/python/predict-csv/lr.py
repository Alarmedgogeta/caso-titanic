from http.server import BaseHTTPRequestHandler

from api._titanic import handle_options, predict_csv_request


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        predict_csv_request(self, "lr")
