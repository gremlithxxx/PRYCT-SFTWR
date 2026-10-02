from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

@app.route("/")
def dashboard():
    return render_template("dashboard.html", vista_activa="dashboard")

@app.route("/perfil")
def perfil():
    return render_template("perfil.html", vista_activa="perfil")

@app.route("/metas")
def metas():
    return render_template("metas.html", vista_activa="metas")

@app.route("/simulador")
def simulador():
    return render_template("simulador.html", vista_activa="simulador")

@app.route("/manifest.json")
def manifest():
    return app.send_static_file("manifest.json")

@app.route("/sw.js")
def service_worker():
    response = app.send_static_file("sw.js")
    response.headers["Content-Type"] = "application/javascript"
    response.headers["Service-Worker-Allowed"] = "/"
    return response

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)