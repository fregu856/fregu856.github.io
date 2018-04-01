"""
- DOES: contains backend code for local live demo webpage.
"""

from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    return render_template("index.html")

@app.route("/image_captioning", methods=["GET", "POST"])
def image_captioning():
    return render_template("image_captioning.html")

@app.route("/hogskolevalet18", methods=["GET", "POST"])
def hogskolevalet18():
    return render_template("hogskolevalet18.html")

if __name__ == '__main__':
    app.run()
