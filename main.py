import io
import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from ultralytics import YOLO
from PIL import Image

# Inicializa o aplicativo FastAPI
app = FastAPI(
    title="PiraCheck AI",
    description="Interface Web e API para reconhecimento e identificação de peixes",
    version="1.0.0"
)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

MODEL_PATH = os.path.join("weights", "best.pt") 
FALLBACK_MODEL_PATH = os.path.join("weights", "yolov8n.pt")

if os.path.exists(MODEL_PATH):
    try:
        model = YOLO(MODEL_PATH)
        print(f"-> Modelo customizado carregado com sucesso a partir de: {MODEL_PATH}")
    except Exception as e:
        print(f"Erro ao carregar o modelo customizado: {e}. Usando modelo padrão de fallback.")
        model = YOLO(FALLBACK_MODEL_PATH)
else:
    print(f"-> Aviso: '{MODEL_PATH}' não encontrado. Carregando modelo padrão 'yolov8n.pt' para testes.")
    model = YOLO(FALLBACK_MODEL_PATH)

OUTPUT_DIR = os.path.join("static", "uploads")
os.makedirs(OUTPUT_DIR, exist_ok=True)


@app.get("/", response_class=HTMLResponse)
async def render_home(request: Request):
    """
    Rota principal. Quando o utilizador acede a http://127.0.0.1:8000/
    o FastAPI renderiza e entrega a página index.html.
    """
    return templates.TemplateResponse(request=request, name="index.html")



@app.post("/predict")
async def predict_fish(file: UploadFile = File(...)):
    """
    Endpoint que recebe a imagem do peixe enviada pelo JavaScript (Front-end),
    passa pelo YOLO e retorna o resultado em formato JSON.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser uma imagem válida.")

    try:
        image_bytes = await file.read()
        
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        results = model.predict(source=image, conf=0.25)
        result = results[0]
        

        detections = []
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].tolist()
            
            detections.append({
                "peixe": class_name,
                "confianca": round(confidence * 100, 2),
                "box": {
                    "xmin": bbox[0],
                    "ymin": bbox[1],
                    "xmax": bbox[2],
                    "ymax": bbox[3]
                }
            })
            
        saved_image_path = None
        if len(detections) > 0:
            filename_salvo = f"res_{file.filename}"
            full_save_path = os.path.join(OUTPUT_DIR, filename_salvo)
            result.save(filename=full_save_path)
            saved_image_path = f"/static/uploads/{filename_salvo}"

        # Retorna o JSON completo para o front-end
        return JSONResponse(content={
            "sucesso": True,
            "arquivo": file.filename,
            "imagem_processada": saved_image_path,
            "total_detecoes": len(detections),
            "resultados": detections
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento interno: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # Inicializa o servidor local
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)