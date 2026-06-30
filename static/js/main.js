document.addEventListener("DOMContentLoaded", () => {
    // Mapeamento dos elementos do HTML
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

    // ---- 1. Eventos de Drag and Drop (Arrastar e Soltar) ----
    
    // Evita o comportamento padrão do navegador (abrir a imagem em outra aba)
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Destaca a zona de upload quando o arquivo é arrastado por cima
    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add("highlight"), false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove("highlight"), false);
    });

    // Captura o arquivo quando solto na zona
    dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // ---- 2. Evento de Seleção Tradicional (Botão Clique) ----
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // ---- 3. Processamento do Arquivo e Envio para a API ----
    function handleFile(file) {
        // Valida se o arquivo selecionado é mesmo uma imagem
        if (!file.type.startsWith("image/")) {
            alert("Por favor, selecione apenas arquivos de imagem (JPEG, PNG).");
            return;
        }

        // Mostra o preview local da imagem na própria zona de drop
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            imagePreview.src = reader.result;
            imagePreview.classList.remove("hidden");
            dropZoneContent.classList.add("hidden"); // Esconde o texto central
        };

        // Dispara o envio para o servidor
        uploadImage(file);
    }

    async function uploadImage(file) {
        // Altera os estados da tela para o modo "Carregando"
        loadingState.classList.remove("hidden");
        resultSection.classList.add("hidden");

        // Prepara o corpo da requisição usando FormData (multipart/form-data)
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Faz a chamada HTTP assíncrona para o endpoint do FastAPI
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
            // Remove o estado de carregamento independente de ter dado erro ou sucesso
            loadingState.classList.add("hidden");
        }
    }

    // ---- 4. Renderização dos Resultados na Tela ----
    function displayResults(data) {
        // Esconde a zona de upload para focar no resultado
        dropZone.classList.add("hidden");
        resultSection.classList.remove("hidden");

        // Se o YOLO encontrou alguma espécie de peixe
        if (data.total_detecoes > 0) {
            const principalDetecao = data.resultados[0]; // Pega o primeiro peixe encontrado
            
            fishName.textContent = principalDetecao.peixe;
            
            // Atualiza o texto e a largura da barra de confiança
            const confianca = principalDetecao.confianca;
            confidenceText.textContent = `${confianca}%`;
            confidenceBar.style.width = `${confianca}%`;
            
            // Carrega a imagem salva pelo backend (com o retângulo do YOLO)
            // Adicionamos um timestamp no final (?t=...) para forçar o navegador a não pegar do cache antigo
            resultImage.src = `${data.imagem_processada}?t=${new Date().getTime()}`;
        } else {
            // Caso a imagem tenha sido processada mas nenhum peixe foi achado
            fishName.textContent = "Não identificado";
            confidenceText.textContent = "0%";
            confidenceBar.style.width = "0%";
            resultImage.src = imagePreview.src; // Mostra a imagem original enviada
            alert("A IA não conseguiu identificar nenhum peixe nesta imagem. Tente uma foto mais clara.");
        }
    }

    // ---- 5. Resetar o Fluxo (Botão "Identificar Nova Imagem") ----
    btnReset.addEventListener("click", resetUI);

    function resetUI() {
        // Limpa os campos de arquivo
        fileInput.value = "";
        imagePreview.src = "#";
        resultImage.src = "#";
        
        // Restaura a visibilidade padrão das seções
        imagePreview.classList.add("hidden");
        dropZoneContent.classList.remove("hidden");
        dropZone.classList.remove("hidden");
        resultSection.classList.add("hidden");
        loadingState.classList.add("hidden");
        
        // Zera as métricas visuais
        fishName.textContent = "Buscando...";
        confidenceText.textContent = "0%";
        confidenceBar.style.width = "0%";
    }
});