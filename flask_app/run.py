from flask import Flask, render_template
from blueprints.file_utils import bp as file_utils_bp
from blueprints.main_route import bp as main_route_bp

app = Flask(__name__)
app.register_blueprint(file_utils_bp)
app.register_blueprint(main_route_bp)

@app.route('/')
def home():
    return render_template('window.html')

if __name__ == '__main__':
    app.run(debug= True, host= '0.0.0.0')