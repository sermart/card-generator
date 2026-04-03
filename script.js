const givenInput = document.getElementById("givenInput");
const findInput = document.getElementById("findInput");
const givenOutput = document.getElementById("givenOutput");
const findOutput = document.getElementById("findOutput");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const card = document.getElementById("card");

let timer;

// Авто-рост для обоих textarea
function autoResizeGiven() {
    givenInput.style.height = "auto";
    givenInput.style.height = givenInput.scrollHeight + "px";
}

function autoResizeFind() {
    findInput.style.height = "auto";
    findInput.style.height = findInput.scrollHeight + "px";
}

givenInput.addEventListener("input", autoResizeGiven);
findInput.addEventListener("input", autoResizeFind);

function debounceRender() {
    clearTimeout(timer);
    timer = setTimeout(render, 200);
}

givenInput.addEventListener("input", debounceRender);
findInput.addEventListener("input", debounceRender);

function transform(text) {
    if (!text) return "";

    let result = text;
    
    // 0. СОХРАНЯЕМ ПРОБЕЛЫ ПЕРЕД ЗНАКАМИ ПРЕПИНАНИЯ
    // Заменяем " ?" на " \\text{ }?" чтобы сохранить пробел
    result = result.replace(/ \?/g, " \\text{ }?");
    result = result.replace(/\?/g, "?");
    
    // 1. ДЕЛЬТА — заменяем ТОЛЬКО отдельную букву d
    result = result.replace(/(^|\s)d([A-Za-zА-Яа-я])/g, "$1\\Delta $2");
    result = result.replace(/([A-Za-zА-Яа-я])d(\s|$)/g, "$1\\Delta $2");
    result = result.replace(/(^|\s)d(\s|$)/g, "$1\\Delta $2");
    result = result.replace(/(^|\s)d(\d)/g, "$1\\Delta $2");
    
    // 2. Умножение * на \cdot (но не **)
    result = result.replace(/([^*])\*([^*])/g, "$1\\cdot $2");
    result = result.replace(/^\*([^*])/, "\\cdot $1");
    result = result.replace(/([^*])\*$/, "$1\\cdot ");
    
    // 3. Градусы
    result = result.replace(/(\d+)g/g, "$1^{\\circ}");
    
    // 4. Степени
    result = result.replace(/([a-zA-Zа-яА-Я\d\)\]\}]+)\*\*([a-zA-Zа-яА-Я\d\(\[\{]+)/g, "$1^{$2}");
    
    // 5. Нижние индексы
    result = result.replace(/([a-zA-Zа-яА-Я0-9\)\]\}]+)_(\d+)/g, "$1_{$2}");
    result = result.replace(/([a-zA-Zа-яА-Я0-9\)\]\}]+)_([a-zA-Zа-яА-Я0-9]+)/g, "$1_{$2}");
    
    // 6. Дроби
    let changed = true;
    let maxIterations = 10;
    let iteration = 0;
    
    while (changed && iteration < maxIterations) {
        changed = false;
        iteration++;
        
        let newText = result.replace(/\(([^()]+)\)\/(\([^()]+\))/g, (match, num, den) => {
            changed = true;
            return `\\frac{${num}}{${den}}`;
        });
        
        newText = newText.replace(/([a-zA-Zа-яА-Я0-9\^\\\{\}\(\)\cdot]+)\/(\([^()]+\))/g, (match, num, den) => {
            changed = true;
            return `\\frac{${num.trim()}}{${den}}`;
        });
        
        newText = newText.replace(/\(([^()]+)\)\/([a-zA-Zа-яА-Я0-9\^\\\{\}\(\)\cdot]+)/g, (match, num, den) => {
            changed = true;
            return `\\frac{${num}}{${den}}`;
        });
        
        newText = newText.replace(/([a-zA-Zа-яА-Я0-9\^\\\{\}\(\)\cdot]+)\/([a-zA-Zа-яА-Я0-9\^\\\{\}\(\)\cdot]+)/g, (match, num, den) => {
            if (match.includes('\\frac')) return match;
            changed = true;
            return `\\frac{${num}}{${den}}`;
        });
        
        result = newText;
    }
    
    // 7. Корень
    result = result.replace(/s\(([^)]+)\)/g, (match, content) => {
        return `\\sqrt{${content}}`;
    });
    
    return result;
}

function render() {
    // Рендер "Дано" (многострочный)
    const givenLines = givenInput.value.split("\n");
    givenOutput.innerHTML = "";
    
    givenLines.forEach(line => {
        if (line.trim() === "") return;
        
        const div = document.createElement("div");
        try {
            const transformed = transform(line);
            katex.render(transformed, div, { throwOnError: false });
        } catch (e) {
            div.textContent = line;
            div.style.color = "#e53e3e";
        }
        givenOutput.appendChild(div);
    });
    
    // Рендер "Найти" (многострочный)
    const findLines = findInput.value.split("\n");
    findOutput.innerHTML = "";
    
    findLines.forEach(line => {
        if (line.trim() === "") return;
        
        const div = document.createElement("div");
        try {
            const transformed = transform(line);
            katex.render(transformed, div, { throwOnError: false });
        } catch (e) {
            div.textContent = line;
            div.style.color = "#e53e3e";
        }
        findOutput.appendChild(div);
    });
}

clearBtn.addEventListener("click", () => {
    givenInput.value = "";
    findInput.value = "";
    givenOutput.innerHTML = "";
    findOutput.innerHTML = "";
    autoResizeGiven();
    autoResizeFind();
    render();
});

downloadBtn.addEventListener("click", () => {
    html2canvas(card, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false
    }).then(canvas => {
        const link = document.createElement("a");
        link.download = "card.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        console.error("Ошибка:", err);
    });
});

// Запуск
autoResizeGiven();
autoResizeFind();
render();