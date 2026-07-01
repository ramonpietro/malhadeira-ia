import io
import os
import json
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from ultralytics import YOLO
from PIL import Image

app = FastAPI(
    title="Malhadeira AI",
    description="Interface Web e API para reconhecimento e identificação de peixes",
    version="1.0.0"
)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

MODEL_PATH = os.path.join("weights", "best.pt") 
FALLBACK_MODEL_PATH = os.path.join("weights", "yolov8n-cls.pt")

if os.path.exists(MODEL_PATH):
    try:
        model = YOLO(MODEL_PATH)
        print(f"-> Modelo customizado carregado com sucesso a partir de: {MODEL_PATH}")
    except Exception as e:
        print(f"Erro ao carregar o modelo customizado: {e}. Usando modelo padrão de fallback.")
        model = YOLO(FALLBACK_MODEL_PATH)
else:
    print(f"-> Aviso: '{MODEL_PATH}' não encontrado. Carregando modelo padrão 'yolov8n-cls.pt' para testes.")
    model = YOLO(FALLBACK_MODEL_PATH)

OUTPUT_DIR = os.path.join("static", "uploads")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DADOS_ECOLOGICOS_PATH = "peixes.json"
if os.path.exists(DADOS_ECOLOGICOS_PATH):
    try:
        with open(DADOS_ECOLOGICOS_PATH, "r", encoding="utf-8") as f:
            dados_peixes = json.load(f)
        print(f"-> Catálogo ecológico '{DADOS_ECOLOGICOS_PATH}' carregado com sucesso.")
    except Exception as e:
        print(f"Erro ao ler o arquivo {DADOS_ECOLOGICOS_PATH}: {e}. Usando catálogo vazio.")
        dados_peixes = {}
else:
    print(f"-> Aviso: '{DADOS_ECOLOGICOS_PATH}' não encontrado. Criando base de dados vazia em memória.")
    dados_peixes = {}


@app.get("/", response_class=HTMLResponse)
async def render_home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/predict")
async def predict_fish(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado precisa ser uma imagem válida.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        results = model.predict(source=image)
        result = results[0]
        
        detections = []
        
        if hasattr(result, 'probs') and result.probs is not None:
            top1_id = int(result.probs.top1)
            raw_confidence = float(result.probs.top1conf)
            
            confidence_percentage = round(raw_confidence * 100, 2)
            
            class_name = model.names.get(top1_id, "desconhecido").lower()
            
            info_ecologica = dados_peixes.get(class_name, {
                "habitat": "Espécie em fase de catalogação técnica no sistema.",
                "distribuicao": "Distribuição geográfica em fase de mapeamento."
            })
            
            detections.append({
                "peixe": class_name,
                "confianca": confidence_percentage,
                "habitat": info_ecologica.get("habitat", "Não informado."),
                "distribuicao": info_ecologica.get("distribuicao", "Não informado."),
                "box": {"xmin": 0, "ymin": 0, "xmax": 0, "ymax": 0} 
            })
            
        filename_salvo = f"res_{file.filename}"
        saved_image_path = f"/static/uploads/{filename_salvo}"
        full_save_path = os.path.join(OUTPUT_DIR, filename_salvo)
        image.save(full_save_path)

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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)