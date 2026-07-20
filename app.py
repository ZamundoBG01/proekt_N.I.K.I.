from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Привет! Приложението работи успешно на Render!"

if __name__ == "__main__":
    app.run()
