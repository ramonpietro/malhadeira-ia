# 🐟 Malhadeira: Reconhecimento de Espécies de Peixes

O **Malhadeira** é uma plataforma inteligente para identificação automática de espécies de peixes por meio de Inteligência Artificial. A partir do envio de uma fotografia, o sistema identifica a espécie e apresenta informações relevantes, como habitat natural, distribuição geográfica e outros dados ecológicos.

Este projeto foi desenvolvido pelos discentes **Heliny Ramos Oliveira** e **Ramon Pietro Roque dos Santos** como trabalho da disciplina de **Inteligência Artificial**.

---

## Funcionalidades

- Identificação automática de espécies de peixes por imagem;
- Interface web simples e intuitiva;
- Exibição de informações ecológicas da espécie identificada;
- Arquitetura baseada em FastAPI.

---

## Tecnologias utilizadas

- Python 3.11+
- FastAPI
- Jinja2
- Ultralytics YOLO
- OpenCV
- Pillow

---

# Como executar o projeto

## 1. Pré-requisitos

Antes de iniciar, certifique-se de possuir:

- Python **3.11** ou superior;
- pip instalado.

---

## 2. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd malhadeira
```

---

## 3. Criar o ambiente virtual

Na raiz do projeto, execute:

```bash
python -m venv .venv
```

Ative o ambiente virtual:

**Windows**

```bash
.venv\Scripts\activate
```

**Linux/macOS**

```bash
source .venv/bin/activate
```

---

## 4. Instalar as dependências

```bash
pip install -r requirements.txt
```

---

## 5. Executar a aplicação

```bash
python main.py
```

Após a inicialização, a aplicação estará disponível em:

**http://127.0.0.1:8000**

---

# Estrutura do projeto

```
.
├── static/         # Arquivos estáticos (CSS, JavaScript e imagens)
├── templates/      # Templates HTML renderizados pelo Jinja2
├── weights/        # Pesos dos modelos de Inteligência Artificial
├── main.py         # Arquivo principal da aplicação
├── requirements.txt
└── README.md
```

---

# Arquitetura

O projeto utiliza uma arquitetura web baseada em **FastAPI**, composta pelos seguintes módulos:

| Diretório | Descrição |
|-----------|-----------|
| **static/** | Arquivos estáticos utilizados pela interface web, como folhas de estilo, scripts e imagens. |
| **templates/** | Templates HTML renderizados dinamicamente pelo mecanismo Jinja2. |
| **weights/** | Armazena os pesos dos modelos de Inteligência Artificial utilizados na identificação das espécies. |

---

# Autores

- **Heliny Ramos Oliveira**
- **Ramon Pietro Roque dos Santos**

---

# Licença

Este projeto foi desenvolvido para fins acadêmicos como parte da disciplina de Inteligência Artificial.