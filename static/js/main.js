document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("file-input");
    const imagePreview = document.getElementById("image-preview");
    const dropZoneContent = dropZone.querySelector(".drop-zone-content");
    
    const loadingState = document.getElementById("loading-state");
    const resultSection = document.getElementById("result-section");
    
    const resultImage = document.getElementById("result-image");
    const fishName = document.getElementById("fish-name");
    const confidenceBar = document.getElementById("confidence-bar");
    const confidenceText = document.getElementById("confidence-text");
    const btnReset = document.getElementById("btn-reset");

    const fishHabitat = document.getElementById("fish-habitat");
    const fishGeo = document.getElementById("fish-geo");
    
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add("highlight"), false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove("highlight"), false);
    });

    dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith("image/")) {
            alert("Por favor, selecione apenas arquivos de imagem (JPEG, PNG).");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            imagePreview.src = reader.result;
            imagePreview.classList.remove("hidden");
            dropZoneContent.classList.add("hidden");
        };

        uploadImage(file);
    }

    async function uploadImage(file) {
        loadingState.classList.remove("hidden");
        resultSection.classList.add("hidden");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/predict", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Erro no servidor: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.sucesso) {
                displayResults(data);
            } else {
                alert("Não foi possível processar os dados do peixe.");
                resetUI();
            }

        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Ocorreu um erro ao conectar com o serviço de IA.");
            resetUI();
        } finally {
            loadingState.classList.add("hidden");
        }
    }

    function displayResults(data) {
        dropZone.classList.add("hidden");
        resultSection.classList.remove("hidden");

        if (data.total_detecoes > 0) {
            const principalDetecao = data.resultados[0];
            
            const nomeBruto = principalDetecao.peixe;
            const nomeFormatado = nomeBruto
                .replace(/_/g, ' ')
                .split(' ')
                .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
                .join(' ');

            fishName.textContent = nomeFormatado;
            
            if (fishHabitat) fishHabitat.textContent = principalDetecao.habitat;
            if (fishGeo) fishGeo.textContent = principalDetecao.distribuicao;

            let confiancaBruta = principalDetecao.confianca;
            let confiancaFormatada;

            if (confiancaBruta <= 1) {
                confiancaFormatada = (confiancaBruta * 100).toFixed(1);
            } else {
                confiancaFormatada = parseFloat(confiancaBruta).toFixed(1);
            }

            confidenceText.textContent = `${confiancaFormatada}%`;
            confidenceBar.style.width = `${confiancaFormatada}%`;
            
            resultImage.src = `${data.imagem_processada}?t=${new Date().getTime()}`;
        } else {
            fishName.textContent = "Não identificado";
            if (fishHabitat) fishHabitat.textContent = "Espécie não identificada para catalogação.";
            if (fishGeo) fishGeo.textContent = "Sem dados de localização.";
            
            confidenceText.textContent = "0%";
            confidenceBar.style.width = "0%";
            resultImage.src = imagePreview.src;
            alert("A IA não conseguiu identificar nenhum peixe nesta imagem. Tente uma foto mais clara.");
        }
    }

    btnReset.addEventListener("click", resetUI);

    function resetUI() {
        fileInput.value = "";
        imagePreview.src = "#";
        resultImage.src = "#";
        
        imagePreview.classList.add("hidden");
        dropZoneContent.classList.remove("hidden");
        dropZone.classList.remove("hidden");
        resultSection.classList.add("hidden");
        loadingState.classList.add("hidden");
        
        fishName.textContent = "Buscando...";
        if (fishHabitat) fishHabitat.textContent = "Buscando...";
        if (fishGeo) fishGeo.textContent = "Buscando...";
        
        confidenceText.textContent = "0%";
        confidenceBar.style.width = "0%";
    }
});