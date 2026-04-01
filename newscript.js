const debouncedGenerateHTML = (function() {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(generateHTML, 300);
    };
})();

document.addEventListener('DOMContentLoaded', (event) => {
    initializeColorPicker();
    initializeResizer();
    initializeBodyEditor(); 
    generateHTML();

    const dropdown = document.querySelector('.dropdown');
    const dropdownBtn = dropdown.querySelector('.toolbar-button.has-text');
    const dropdownLinks = dropdown.querySelectorAll('.dropdown-content a');

    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
    }

    dropdownLinks.forEach(link => {
        link.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    document.getElementById('input-section').addEventListener('input', debouncedGenerateHTML);

    document.body.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            lastFocusedInput = e.target;
            savedRange = null; 
        }
    });
});

function initializeColorPicker() {
    const colorPicker = document.getElementById("mainColorPicker");
    const colorDisplay = document.querySelector(".color-display");

    colorDisplay.style.backgroundColor = colorPicker.value;
    updatePreviewColor(colorPicker.value); 

    colorPicker.addEventListener("input", (e) => {
        colorDisplay.style.backgroundColor = e.target.value;
        updatePreviewColor(e.target.value); 
        debouncedGenerateHTML(); 
    });
}

function updatePreviewColor(color) {
    const previewElement = document.getElementById("preview");
    if (previewElement) {
        const wikiWrap = previewElement.querySelector("#wikiwrap");
        if (wikiWrap) {
            wikiWrap.style.setProperty('--wiki-main-color', color, 'important');
        }
        
        const mainTable = previewElement.querySelector('.wiki-main-table');
        if (mainTable) {
            mainTable.style.setProperty('border-color', color, 'important');
        }
        
        const wtNameElements = previewElement.querySelectorAll('.wt-name');
        wtNameElements.forEach(element => {
            element.style.setProperty('background-color', color, 'important');
            element.style.setProperty('border-color', color, 'important');
        });

        const wtColorElements = previewElement.querySelectorAll('.wt-color');
        wtColorElements.forEach(element => {
            element.style.setProperty('background-color', color, 'important');
        });
        
        const quotes = previewElement.querySelectorAll('.wiki-quote td');
        quotes.forEach(element => {
             element.style.borderLeftColor = color;
        });
    }
}

function initializeResizer() {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.getElementById('input-section');
    const rightPanel = document.getElementById('preview-section');

    const handleMouseDown = (e) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        const containerRect = resizer.parentElement.getBoundingClientRect();
        const leftBoundary = containerRect.left;
        const rightBoundary = containerRect.right;
        
        let newX = e.clientX;
        if (newX < leftBoundary + 200) newX = leftBoundary + 200;
        if (newX > rightBoundary - 200) newX = rightBoundary - 200;

        const newLeftWidth = newX - leftBoundary;

        leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
        rightPanel.style.flex = '1 1 0';
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    resizer.addEventListener('mousedown', handleMouseDown);
}

function insertFootnote() {
    const text = prompt("각주(주석) 내용을 입력하세요:", "");
    if (!text) return; 

    const formattedText = `{{${text}}}`;

    if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
        document.execCommand('insertText', false, formattedText);
        debouncedGenerateHTML();
        return;
    }

    if (lastFocusedInput) {
        const start = lastFocusedInput.selectionStart;
        const end = lastFocusedInput.selectionEnd;
        const val = lastFocusedInput.value;
        
        lastFocusedInput.value = val.slice(0, start) + formattedText + val.slice(end);
        
        lastFocusedInput.selectionStart = lastFocusedInput.selectionEnd = start + formattedText.length;
        lastFocusedInput.focus();
        debouncedGenerateHTML();
        return;
    }

    alert("각주를 넣을 입력창이나 에디터를 먼저 클릭해주세요.");
}

new Sortable(document.getElementById("field-list"), {
  animation: 150,
  handle: ".drag-handle",
  onEnd: debouncedGenerateHTML
});

function addField() {
  const list = document.getElementById("field-list");
  const row = document.createElement("div");
  row.className = "field-row";
  row.innerHTML = `
    <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
    <input class="field-name" placeholder="항목명" />
    <input class="field-value" placeholder="내용" />
  `;
  list.appendChild(row);
  debouncedGenerateHTML();
}

function generateHTML() {
  const color = document.getElementById("mainColorPicker").value;
  const name = document.getElementById("charName").value.trim();
  const jpSurname = document.getElementById("jpSurname").value.trim();
  const jpSurnameFuri = document.getElementById("jpSurnameFurigana").value.trim();
  const jpName = document.getElementById("jpName").value.trim();
  const jpNameFuri = document.getElementById("jpNameFurigana").value.trim();
  const enName = document.getElementById("enName").value.trim();
  const imageUrl = document.getElementById("imageUrl").value.trim();
  const copyright = document.getElementById("copyright").value.trim();
  const categoryText = document.getElementById("categoryText").value.trim();
  const categoryLink = document.getElementById("categoryLink").value.trim();

  let rubyBlock = '';
  if (jpSurname || jpName) {
    rubyBlock += jpSurname ? `<ruby>${jpSurname}<rt>${jpSurnameFuri}</rt></ruby>` : '';
    rubyBlock += jpSurname && jpName ? '　' : '';
    rubyBlock += jpName ? `<ruby>${jpName}<rt>${jpNameFuri}</rt></ruby>` : '';
  }

  let pipeName = '';
  if ((jpSurname || jpName) && enName) {
    pipeName = ` ｜ ${enName}`;
  } else if (!jpSurname && !jpName && enName) {
    pipeName = `${enName}`;
  }

  const rows = document.querySelectorAll(".field-row");
  let detailRows = '';
  rows.forEach(row => {
    const field = row.querySelector(".field-name").value.trim();
    const value = row.querySelector(".field-value").value.trim();
    if (field && value) {
      detailRows += `<tr><td class="wt-color">${field}</td><td class="wt-detail">${value}</td></tr>\n`;
    }
  });

  let categoryHTML = "";
  if (categoryText) {
    if (categoryLink) {
      categoryHTML = `<p class="wiki-category">분류: <a href="${categoryLink}" target="_blank">${categoryText}</a></p>`;
    } else {
      categoryHTML = `<p class="wiki-category">분류: <span style="color: #0275d8">${categoryText}</span></p>`;
    }
  }

  const indexHTML = generateIndexHTML();
  const bodyHTML = generateBodyHTML();
  
let rawHTML = `
<style>
:root {
    --wiki-main-color: ${color}; 
    --wiki-text-color: #ffffff;
    --wiki-link-color: #0275d8;
    --wiki-border-color: #ddd;
    --wiki-bg-gray: #eee;
    --wiki-max-width: 700px;
    --wiki-font-size: 15px;
    --wiki-line-height: 1.5;
}

#wikiwrap {
    --wiki-main-color: ${color}; 
}

.wiki-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.wiki-main-table {
    order: 1;
}

.wiki-index {
    order: 2;
}

@media (min-width: 768px) {
    .wiki-container {
        flex-direction: row;
        align-items: flex-start;
    }

    .wiki-index {
        order: 1;
        flex: 0 0 250px;
        top: 20px;
    }

    .wiki-main-table {
        order: 2;
        flex: 1;
        min-width: 0;
    }
}

#wikiwrap {
    font-family: "Pretendard JP Variable", "Pretendard JP", "Pretendard", Pretendard, 
                 -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", 
                 "Segoe UI", "Hiragino Sans", "Apple SD Gothic Neo", Meiryo, 
                 "Noto Sans JP", "Noto Sans KR", "Malgun Gothic", Osaka, 
                 "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
    box-sizing: border-box;
    font-size: var(--wiki-font-size);
    line-height: var(--wiki-line-height);
    max-width: var(--wiki-max-width);
    margin: 0 auto;
}

#wikiwrap a,
.text1 a,
.wiki-category a,
.wiki-index a {
    color: var(--wiki-link-color) !important;
    text-decoration: none;
}

#wikiwrap a::before,
#wikiwrap a::after,
.text1 a::before,
.wiki-category a::before,
.wiki-index a::before {
    content: none !important;
}

.wiki-main-table {
    border-collapse: collapse;
    width: 100%;
    border: 2px solid var(--wiki-main-color);
    font-size: 0.96em;
    line-height: var(--wiki-line-height);
    margin: 20px 0 16px;
}

.wt-name {
    padding: 5px 10px;
    border: 2px solid var(--wiki-main-color);
    text-align: center;
    background-color: var(--wiki-main-color);
    color: var(--wiki-text-color);
}

.wt-copyright {
    padding: 5px 10px;
    border: 1px solid var(--wiki-border-color);
    text-align: center;
    color: #000;
}

.wt-color {
    width: 30%;
    padding: 5px 10px;
    border: 1px solid var(--wiki-border-color);
    border-right: 1px solid var(--wiki-border-color);
    border-bottom: 1px solid var(--wiki-border-color);
    text-align: center;
    background-color: var(--wiki-main-color);
    color: var(--wiki-text-color);
}

.wt-detail {
    padding: 5px 10px;
    border: 1px solid var(--wiki-border-color);
    border-bottom: 1px solid var(--wiki-border-color);
    text-align: left;
    color: #000;
}

.wiki-main-table tr:last-child > td {
    border-bottom: none;
}

summary {
    list-style-type: none;
    opacity: 0.5;
    cursor: pointer;
    align-items: center;
    justify-content: center;
}

summary::-webkit-details-marker {
    display: none;
}

details[open] summary {
    opacity: 1;
}

.wiki-h1-icon ion-icon,
.wiki-h2-icon ion-icon,
.wiki-h3-icon ion-icon {
    transition: transform 0.3s ease;
    transform: rotate(-90deg);
}

details[open] .wiki-h1-icon ion-icon,
details[open] .wiki-h2-icon ion-icon,
details[open] .wiki-h3-icon ion-icon {
    transform: rotate(0deg);
}

.text1 {
    font-size: var(--wiki-font-size);
    line-height: var(--wiki-line-height);
}

.wiki-category {
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: normal;
    line-height: var(--wiki-line-height);
    margin: 0 0 1em;
    padding: 0.2rem 0.5rem;
}

.wiki-h1 {
    font-size: 1.8em;
    border-bottom: 1px solid #ccc;
    margin: 1.2em 0 0.7em;
    padding-bottom: 5px;
    font-weight: bold;
}

.wiki-h2 {
    font-size: 1.6em;
    border-bottom: 1px solid #ccc;
    margin: 1.2em 0 0.7em;
    padding-bottom: 5px;
    font-weight: bold;
}

.wiki-h3 {
    font-size: 1.4em;
    border-bottom: 1px solid #ccc;
    margin: 1.2em 0 0.7em;
    padding-bottom: 5px;
    font-weight: bold;
}

.wiki-h1-icon,
.wiki-h2-icon,
.wiki-h3-icon {
    color: #666;
    float: left;
    font-weight: 400;
    line-height: 1em;
    text-align: center;
    width: 0.9em;
    margin-right: 0.4em;
    margin-top: 0.2em;
}

.wiki-index {
    border-collapse: collapse;
    width: auto;
    max-width: 250px;
    border: 1px solid #ccc;
    margin: 0 0 20px 5px;
    line-height: 1.8;
}

.wiki-quote {
    border-collapse: collapse;
    width: auto;
    height: auto;
    margin: 1em 0;
}

.wiki-quote td {
    width: 100%;
    border: 2px dashed #ccc;
    border-left: 5px solid var(--wiki-main-color);
    background: var(--wiki-bg-gray);
    padding: 1em;
    line-height: 1.6;
}

.wiki-quote hr {
    border: 0;
    border-top: 1px solid #ccc;
    margin: 0.5em 0;
}

.wiki-footnote {
    border-top: 1px solid #777;
    margin: 1.5em 0;
    padding: 0.5em 0;
    font-size: 0.9em;
}
.wiki-footnote p {
    margin: 5px 0;
}

.wikigreenicon {
    background: green;
    color: white;
    padding: 0 0.08em;
    font-size: var(--wiki-font-size);
    vertical-align: middle;
}

.wikigreentext {
    color: green;
    vertical-align: middle;
    font-size: var(--wiki-font-size);
    line-height: var(--wiki-line-height);
}

.wikigreen:hover {
    text-decoration: underline;
    text-decoration-color: green;
}

.wiki-img-sing {
    width: 100%;
    margin: 1em 0;
    border-collapse: collapse;
    line-height: 0;
}

.wiki-img-sing td {
    padding: 0;
    border: 2px solid var(--wiki-main-color);
}

.wiki-img-sing img {
    display: block;
    width: 100%;
    height: auto;
}

.wiki-img-sing iframe {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 0;
    box-shadow: none;
}
.wiki-img-sing iframe[src*="youtube.com"] {
    border-radius: 0 !important;
}
.wiki-fn-link {
    position: relative;
    display: inline-block;
    cursor: pointer;
    text-decoration: none !important;
}
.wiki-fn-tooltip {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 8px 12px;
    width: max-content;
    max-width: 250px;
    z-index: 100;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    text-align: left;
    white-space: normal;
    margin-bottom: 8px; 
    
    font-size: calc(var(--wiki-font-size) * 0.9);
    line-height: var(--wiki-line-height);
    font-weight: normal !important;
}

.wiki-fn-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #ccc transparent transparent transparent; 
}

@media (min-width: 768px) {
    .wiki-fn-link:hover .wiki-fn-tooltip {
        display: block;
    }
}

.wiki-modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.3);
    z-index: 99998;
}
.wiki-modal-overlay.active {
    display: block;
}
.wiki-modal-box {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 15px;
    width: 80%;
    max-width: 300px;
    z-index: 99999;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    
    font-size: calc(var(--wiki-font-size) * 0.9);
    line-height: var(--wiki-line-height);
    font-weight: normal !important;
}
</style>
<div id="wikiwrap">
  ${categoryHTML}
  
  <div class="wiki-container">
    <table class="wiki-main-table">
      <tbody>
        <tr>
          <td class="wt-name" colspan="2">
            <b><span style="font-size: 20px;">${name}</span></b><br />
            <b><span style="font-size: 13px; line-height: 180%;">${rubyBlock}${pipeName}</span></b>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 0; border: 2px solid var(--wiki-main-color); border-bottom: var(--wiki-border-color);">
            <div style="text-align: center;">
              <img src="${imageUrl}" width="100%" style="display:block;" />
            </div>
          </td>
        </tr>
        ${copyright ? `<tr><td class="wt-copyright" colspan="2">${copyright}</td></tr>` : ''}
        ${detailRows}
      </tbody>
    </table>
    ${indexHTML}
  </div>
  ${bodyHTML}
</div>
`.trim();

    const processedData = processFootnotes(rawHTML);
    const fullHTML = processedData.html; 

    document.getElementById("output").value = fullHTML;
    document.getElementById("preview").innerHTML = fullHTML; 
    
    updatePreviewColor(color);
}

function processFootnotes(html) {
    const footnoteList = [];
    let counter = 1;

    const processedHTML = html.replace(/\{\{(.*?)\}\}/g, (match, content) => {
        const tooltipContent = `<span style="color: var(--wiki-link-color);">[${counter}]</span> <span style="color: #333;">${content}</span>`;
        
        const anchorLink = `<a name="돌아가기${counter}"></a><a href="#각주${counter}" class="wiki-fn-link" onclick="openWikiModal(event, this)"><sup>[${counter}]</sup><span class="wiki-fn-tooltip">${tooltipContent}</span></a>`;
        
        footnoteList.push({
            id: counter,
            content: content
        });
        
        counter++;
        return anchorLink;
    });

    let footnoteSection = '';
    let modalScript = '';
    
    if (footnoteList.length > 0) {
        let listItems = '';
        footnoteList.forEach(item => {
            listItems += `<p><a name="각주${item.id}"></a><a href="#돌아가기${item.id}">[${item.id}]</a> ${item.content}</p>\n`;
        });

        footnoteSection = `
            <div class="text1 wiki-footnote">
                ${listItems}
            </div>`;
            
        modalScript = `
            <script>
            function openWikiModal(e, el) {
                if (window.innerWidth >= 768) return; 
                
                e.preventDefault(); 
                
                const existingOverlay = document.getElementById('wiki-fn-overlay');
                if (existingOverlay) existingOverlay.remove();

                const tooltipContent = el.querySelector('.wiki-fn-tooltip').innerHTML;
                
                const overlay = document.createElement('div');
                overlay.id = 'wiki-fn-overlay';
                overlay.className = 'wiki-modal-overlay active';
                
                const modal = document.createElement('div');
                modal.className = 'wiki-modal-box';
                modal.innerHTML = tooltipContent;
                
                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                });
            }
            </script>
        `;
        
        const lastDivIndex = processedHTML.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
            return {
                html: processedHTML.substring(0, lastDivIndex) + footnoteSection + modalScript + processedHTML.substring(lastDivIndex)
            };
        }
    }

    return { html: processedHTML };
}

function copyCode() {
  const code = document.getElementById("output");
  code.select();
  document.execCommand("copy");
  alert("코드가 복사되었습니다!");
}

document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    const selectedTab = button.dataset.tab;
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
    document.getElementById("tab-" + selectedTab).classList.remove("hidden");
  });
});

let lastFocusedInput = null;
let savedRange = null;

function initializeBodyEditor() {
    const editorContainer = document.getElementById("editor-container");
    new Sortable(editorContainer, {
        animation: 150,
        handle: ".editable-block",
        scroll: true,
        forceFallback: true,
        scrollSensitivity: 100, 
        scrollSpeed: 20,
        bubbleScroll: true,
        onEnd: debouncedGenerateHTML
    });

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if(editorContainer.contains(range.commonAncestorContainer)) {
                savedRange = range.cloneRange();
                lastFocusedInput = null;
            }
        }
    };
    editorContainer.addEventListener('mouseup', saveSelection);
    editorContainer.addEventListener('keyup', saveSelection);

    const fontColorPicker = document.getElementById('fontColorPicker');
    const fontColorButton = document.querySelector('label[for="fontColorPicker"]');

    fontColorButton.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (!savedRange) {
             editorContainer.querySelector('[contenteditable="true"]')?.focus();
        }
        fontColorPicker.click();
    });

fontColorPicker.addEventListener('input', () => {
        if (savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRange);
            
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('foreColor', false, fontColorPicker.value);
            
            if (selection.rangeCount > 0) {
                savedRange = selection.getRangeAt(0).cloneRange();
            }
            debouncedGenerateHTML();
        }
    });

    const bgColorPicker = document.getElementById('bgColorPicker');
    const bgColorButton = document.querySelector('label[for="bgColorPicker"]');

    bgColorButton.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (!savedRange) {
             editorContainer.querySelector('[contenteditable="true"]')?.focus();
        }
        bgColorPicker.click();
    });

    bgColorPicker.addEventListener('input', () => {
        if (savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRange);
            
            document.execCommand('styleWithCSS', false, true); 
            
            if (!document.execCommand('hiliteColor', false, bgColorPicker.value)) {
                document.execCommand('backColor', false, bgColorPicker.value);
            }
            
            if (selection.rangeCount > 0) {
                savedRange = selection.getRangeAt(0).cloneRange();
            }
            debouncedGenerateHTML();
        }
    });
}

function applyLink() {
    if (!savedRange || savedRange.collapsed) {
        alert("링크를 적용할 텍스트를 먼저 선택(드래그)해주세요.");
        return;
    }
    const url = prompt("연결할 URL을 입력하세요:", "https://");
    if (url) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
        document.execCommand('createLink', false, url);
        
        let anchorNode = selection.anchorNode;
        if (anchorNode.nodeType !== Node.ELEMENT_NODE) {
            anchorNode = anchorNode.parentNode;
        }
        if (anchorNode && anchorNode.tagName === 'A') {
             anchorNode.target = "_blank";
        }
        debouncedGenerateHTML();
    }
}

function applySourceLink() {
    const url = prompt("출처 URL을 입력하세요:", "");
    if (!url) return;
    const text = prompt("표시할 텍스트를 입력하세요:", "출처");
    if (!text) return;

    const sourceHtml = `
        <span contenteditable="false" style="display: inline-block; white-space: nowrap;">
            <a class="wikigreen" href="${url}" target="_blank">
                <ion-icon class="wikigreenicon md hydrated" name="link" role="img"></ion-icon>
                <span class="wikigreentext">${text}</span>
            </a>
        </span>&nbsp;`;
    
    const selection = window.getSelection();
    if (savedRange) {
         selection.removeAllRanges();
         selection.addRange(savedRange);
    }
    
    document.execCommand('insertHTML', false, sourceHtml);
    debouncedGenerateHTML();
}

function getYoutubeEmbedUrl(url) {
    if (!url) return '';
    let videoId = '';
    const youtubeIdRegex = /^[a-zA-Z0-9_-]{11}$/;

    if (youtubeIdRegex.test(url)) {
        videoId = url;
    } else {
        try {
            const fullUrl = url.startsWith('http') ? url : `${url}`;
            const urlObj = new URL(fullUrl);

            if (urlObj.hostname === 'youtu.be') {
                videoId = urlObj.pathname.slice(1).split('?')[0];
            } else if (urlObj.hostname.includes('youtube.com')) {
                if (urlObj.pathname.includes('embed')) {
                    videoId = urlObj.pathname.split('/embed/')[1].split('?')[0];
                } else if (urlObj.searchParams.has('v')) {
                    videoId = urlObj.searchParams.get('v');
                }
            }
        } catch (e) {
            return '';
        }
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

function updateMediaSrc(inputElement, mediaType) {
    const container = inputElement.closest('.editable-media');
    const mediaElement = container.querySelector(mediaType);
    if (mediaType === 'img') {
        mediaElement.src = inputElement.value;
    } else if (mediaType === 'iframe') {
        const embedUrl = getYoutubeEmbedUrl(inputElement.value);
        if (embedUrl) {
            mediaElement.src = embedUrl;
        }
    }
}

function updateMediaBorderColor(colorInput) {
    const container = colorInput.closest('.editable-media');
    const table = container.querySelector('.wiki-img-sing');
    const allCells = table.querySelectorAll('td');
    
    colorInput.previousElementSibling.style.backgroundColor = colorInput.value;
    
    allCells.forEach(cell => {
        cell.style.borderColor = colorInput.value;
    });
}

function addBlock(type, data = {}) {
    const container = document.getElementById("editor-container");
    const block = document.createElement("div");
    block.className = "editable-block";
    block.dataset.type = type;

    let contentHTML = '';
    const mainColor = document.getElementById("mainColorPicker").value;

    switch (type) {
        case 'h1':
            contentHTML = `<div class="editable-h1" contenteditable="true">${data.content || '대제목'}</div>`;
            break;
        case 'h2':
            contentHTML = `<div class="editable-h2" contenteditable="true">${data.content || '중제목'}</div>`;
            break;
        case 'h3':
            contentHTML = `<div class="editable-h3" contenteditable="true">${data.content || '소제목'}</div>`;
            break;
        case 'text':
            contentHTML = `<div class="editable-text" contenteditable="true">${data.content || '본문 내용을 입력하세요.'}</div>`;
            break;
        case 'quote':
            const quoteColor = data.color || mainColor;
            contentHTML = `
                <div class="editable-quote" style="border-left-color: ${quoteColor};">
                    <div class="color-picker-wrapper">
                        <label class="quote-color-display" title="대사 색상 선택" style="background-color: ${quoteColor};"></label>
                        <input type="color" class="quote-color-picker" value="${quoteColor}">
                        <span>대사 색상 선택</span>
                    </div>
                    <div class="quote-content" contenteditable="true">${data.content || '대사 내용을 입력하세요.'}</div>
                </div>`;
            break;
        case 'quote2':
            const quote2Color = data.color || mainColor;
            contentHTML = `
                <div class="editable-quote2" style="border-left-color: ${quote2Color};">
                     <div class="color-picker-wrapper">
                        <label class="quote-color-display" title="대사 색상 선택" style="background-color: ${quote2Color};"></label>
                        <input type="color" class="quote-color-picker" value="${quote2Color}">
                        <span>대사 색상 선택</span>
                    </div>
                    <div class="quote2-dialog" contenteditable="true">${data.dialog || '대사2 내용을 입력하세요.'}</div>
                    <hr/>
                    <div class="quote2-desc" contenteditable="true">${data.desc || '이름/장면 등'}</div>
                    <input type="text" class="quote2-link" value="${data.link || ''}" placeholder="링크를 입력하세요 (선택)" />
                </div>`;
            break;
            
        case 'warn':
            contentHTML = `
                <div class="editable-warn">
                    <span style="font-size: 1.3em;">이 문서에</span> 
                    <a style="color: #0275d8; font-size: 1.3em;" href="https://namu.wiki/w/%EC%8A%A4%ED%8F%AC%EC%9D%BC%EB%9F%AC" target="_blank" rel="noopener">스포일러</a>
                    <span style="font-size: 1.3em;">가 포함되어 있습니다.</span><br /><br />
                    이 문서가 설명하는 작품이나 인물 등에 대한 줄거리, 결말, 반전 요소 등을 직·간접적으로 포함하고 있습니다.
                </div>`;
            break;
        case 'image':
            const imageUrl = data.url || prompt("이미지 URL을 입력하세요:");
            if (!imageUrl) return;
            const imgBorderColor = data.borderColor || mainColor;
            const imgHasDesc = data.hasDescription !== undefined ? data.hasDescription : true;
            const imgDescBg = data.descriptionBg || imgBorderColor;
            const imgDescText = data.descriptionTextColor || '#ffffff';
            contentHTML = `
    <div class="editable-media">
        <table class="wiki-img-sing" style="margin: 0;">
            <tbody>
                <tr><td style="border-color: ${imgBorderColor}; padding: 0;"><img src="${imageUrl}" alt="사용자 이미지" style="width: 100%; height: auto; display: block;"></td></tr>
                ${imgHasDesc ? `<tr><td class="media-description-cell" contenteditable="true" style="background-color: ${imgDescBg}; color: ${imgDescText}; border-color: ${imgBorderColor}; padding: 5px 10px; line-height: 1.5; text-align: center; word-wrap: break-word; white-space: normal; min-height: 20px; vertical-align: top;">${data.description || '이미지 설명을 입력하세요'}</td></tr>` : ''}
            </tbody>
        </table>
        <input type="text" class="media-url" value="${imageUrl}" oninput="updateMediaSrc(this, 'img')" placeholder="Image URL">
        <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
            <label class="color-display" title="테두리 색상 선택" style="background-color: ${imgBorderColor};"></label>
            <input type="color" class="media-border-color" value="${imgBorderColor}" 
                   oninput="updateMediaBorderColor(this)">
            <span>테두리 색상</span>
        </div>
        <div class="description-settings">
                        <label style="display: flex; align-items: center; gap: 5px; margin-top: 10px;">
                            <input type="checkbox" class="desc-enabled" ${imgHasDesc ? 'checked' : ''}>
                            설명란 사용
                        </label>
                        <div class="desc-options" style="display: ${imgHasDesc ? 'block' : 'none'};">
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
                                <label class="color-display" title="설명란 배경색" style="background-color: ${imgDescBg};"></label>
                                <input type="color" class="desc-bg-color" value="${imgDescBg}">
                                <span>배경색</span>
                            </div>
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 5px;">
                                <label class="color-display" title="설명란 텍스트 색상" style="background-color: ${imgDescText};"></label>
                                <input type="color" class="desc-text-color" value="${imgDescText}">
                                <span>텍스트 색상</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            break;
                case 'youtube':
            const youtubeUrl = data.url || prompt("유튜브 영상 ID를 입력하세요:");
            if (!youtubeUrl) return;
            const embedUrl = getYoutubeEmbedUrl(youtubeUrl);
            if (!embedUrl) {
                alert("유효하지 않은 ID입니다.");
                return;
            }
            const ytBorderColor = data.borderColor || mainColor;
            const ytHasDesc = data.hasDescription !== undefined ? data.hasDescription : true;
            const ytDescBg = data.descriptionBg || ytBorderColor;
            const ytDescText = data.descriptionTextColor || '#ffffff';
            contentHTML = `
    <div class="editable-media">
        <table class="wiki-img-sing" style="margin: 0;">
            <tbody>
                <tr><td style="border-color: ${ytBorderColor}; padding: 0;"><iframe src="${embedUrl}" style="display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; border-radius: 0; box-shadow: none;"></iframe></td></tr>
                ${ytHasDesc ? `<tr><td class="media-description-cell" contenteditable="true" style="background-color: ${ytDescBg}; color: ${ytDescText}; border-color: ${ytBorderColor}; padding: 5px 10px; line-height: 1.5; text-align: center; word-wrap: break-word; white-space: normal; min-height: 20px; vertical-align: top;">${data.description || '영상 설명을 입력하세요'}</td></tr>` : ''}
            </tbody>
        </table>
        <input type="text" class="media-url" value="${youtubeUrl}" oninput="updateMediaSrc(this, 'iframe')" placeholder="YouTube URL or ID">
        <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
            <label class="color-display" title="테두리 색상 선택" style="background-color: ${ytBorderColor};"></label>
            <input type="color" class="media-border-color" value="${ytBorderColor}"
                   oninput="updateMediaBorderColor(this)">
            <span>테두리 색상</span>
        </div>
        <div class="description-settings">
                        <label style="display: flex; align-items: center; gap: 5px; margin-top: 10px;">
                            <input type="checkbox" class="desc-enabled" ${ytHasDesc ? 'checked' : ''}>
                            설명란 사용
                        </label>
                        <div class="desc-options" style="display: ${ytHasDesc ? 'block' : 'none'};">
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 10px;">
                                <label class="color-display" title="설명란 배경색" style="background-color: ${ytDescBg};"></label>
                                <input type="color" class="desc-bg-color" value="${ytDescBg}">
                                <span>배경색</span>
                            </div>
                            <div class="color-picker-wrapper" style="justify-content: center; margin-top: 5px;">
                                <label class="color-display" title="설명란 텍스트 색상" style="background-color: ${ytDescText};"></label>
                                <input type="color" class="desc-text-color" value="${ytDescText}">
                                <span>텍스트 색상</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            break;
    }

    block.innerHTML = contentHTML + `<button class="delete-block-btn" onclick="this.parentElement.remove(); debouncedGenerateHTML();"><i class="fa-solid fa-xmark"></i></button>`;
    
    const currentElement = document.activeElement.closest('.editable-block');
    if (currentElement && container.contains(currentElement)) {
        currentElement.after(block);
    } else {
        container.appendChild(block);
    }
    
    const editableContent = block.querySelector('[contenteditable="true"]');
    if(editableContent) {
        editableContent.focus();
    }
    
    const allColorLabels = block.querySelectorAll('.color-display, .quote-color-display');
    allColorLabels.forEach(label => {
        label.addEventListener('click', () => {
            const nextSibling = label.nextElementSibling;
            if (nextSibling && nextSibling.type === 'color') {
                nextSibling.click();
            }
        });
    });

    const quoteColorInput = block.querySelector('.quote-color-picker');
    if (quoteColorInput) {
        quoteColorInput.addEventListener('input', function() {
            const parentBlock = this.closest('.editable-quote, .editable-quote2');
            if (parentBlock) {
                parentBlock.style.borderLeftColor = this.value;
            }
            const label = this.previousElementSibling;
            if (label) {
                label.style.backgroundColor = this.value;
            }
            debouncedGenerateHTML();
        });
    }

    const descCheckbox = block.querySelector('.desc-enabled');
    if (descCheckbox) {
        descCheckbox.addEventListener('change', function() {
            const container = this.closest('.editable-media');
            const table = container.querySelector('.wiki-img-sing tbody');
            const descRow = table.querySelector('.media-description-cell')?.closest('tr');
            const descOptions = this.closest('.description-settings').querySelector('.desc-options');
            
            if (this.checked) {
                if (!descRow) {
                    const borderColor = container.querySelector('.media-border-color').value;
                    const bgColor = container.querySelector('.desc-bg-color').value;
                    const textColor = container.querySelector('.desc-text-color').value;
                    
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `<td class="media-description-cell" contenteditable="true" style="background-color: ${bgColor}; color: ${textColor}; border-color: ${borderColor}; padding: 10px; text-align: center; word-wrap: break-word; white-space: normal; min-height: 20px; vertical-align: top;">설명을 입력하세요</td>`;
                    table.appendChild(newRow);
                }
                descOptions.style.display = 'block';
            } else {
                if (descRow) {
                    descRow.remove();
                }
                descOptions.style.display = 'none';
            }
            debouncedGenerateHTML();
        });
    }

    const descBgColorInput = block.querySelector('.desc-bg-color');
    if (descBgColorInput) {
        descBgColorInput.addEventListener('input', function() {
            const descCell = this.closest('.editable-media').querySelector('.media-description-cell');
            if (descCell) {
                descCell.style.backgroundColor = this.value;
            }
            debouncedGenerateHTML();
        });
        
    }

    const descTextColorInput = block.querySelector('.desc-text-color');
    if (descTextColorInput) {
        descTextColorInput.addEventListener('input', function() {
            const descCell = this.closest('.editable-media').querySelector('.media-description-cell');
            if (descCell) {
                descCell.style.color = this.value;
            }
            debouncedGenerateHTML();
        });
    }

    debouncedGenerateHTML();
}

function generateBodyHTML() {
    const blocks = document.querySelectorAll("#editor-container .editable-block");
    let bodyHTML = "";
    let h1Index = 0, h2Index = 0, h3Index = 0;
    let openDetails = false;

    blocks.forEach(block => {
        const type = block.dataset.type;
        let content = '';

        if (type.startsWith('h')) {
            if (openDetails) {
                bodyHTML += `</details>\n`; 
            }
            const level = type.charAt(1);
            const textHTML = block.querySelector(`[contenteditable]`).innerHTML.trim();
            if(!textHTML) return;
            
            if (level === "1") {
                h1Index++; h2Index = 0; h3Index = 0;
            } else if (level === "2") {
                h2Index++; h3Index = 0;
            } else if (level === "3") {
                h3Index++;
            }
            const indexText = level === "1" ? `${h1Index}.` : (level === "2" ? `${h1Index}.${h2Index}` : `${h1Index}.${h2Index}.${h3Index}`);
            const anchor = `목차${indexText.replace(/\./g, "-")}`;
            const headingClass = `wiki-h${level}`;
            const iconClass = `wiki-h${level}-icon`;

            bodyHTML += `<details open><summary class="text1"><h2 class="${headingClass}"><span class="${iconClass}"><ion-icon name="chevron-down-outline"></ion-icon></span> <a name="${anchor}"></a><a href="#목차">${indexText}</a> ${textHTML}</h2></summary>\n`;
            openDetails = true;
        } else {
            if (!openDetails && blocks.length > 0 && !block.previousElementSibling?.dataset.type.startsWith('h')) {
                bodyHTML += `<details open style="display:none;"><summary></summary>\n`;
                openDetails = true;
            }
            switch (type) {
                case 'text':
                    content = block.querySelector('.editable-text').innerHTML;
                    bodyHTML += `<p class="text1">${content}</p>\n`;
                    break;
                case 'quote':
                    const quoteContent = block.querySelector('.quote-content').innerHTML;
                    const quoteColor = block.querySelector('.quote-color-picker').value;
                    bodyHTML += `<table class="wiki-quote"><tbody><tr><td class="text1" style="border-left: 5px solid ${quoteColor};">${quoteContent}</td></tr></tbody></table>\n`;
                    break;
                case 'quote2':
                    const dialog = block.querySelector(".quote2-dialog").innerHTML;
                    const desc = block.querySelector(".quote2-desc").innerHTML;
                    const link = block.querySelector(".quote2-link").value.trim();
                    const color = block.querySelector(".quote-color-picker").value;
                    const linkPart = link ? `<a class="text1" href="${link}" target="_blank">${desc}</a>` : desc;
                    bodyHTML += `<table class="wiki-quote"><tbody><tr><td class="text1" style="border-left: 5px solid ${color};">${dialog}<hr />${linkPart}</td></tr></tbody></table>\n`;
                    break;
                case 'warn':
                    bodyHTML += `<table class="text1" style="border-collapse: collapse; width: 100%; border: 1px solid #dddddd;" data-ke-align="alignLeft"><tbody><tr><td style="width: 100%; border: 1px solid gray; border-top: 5px solid orange; padding: 12px;"><span style="font-size: 1.3em;">이 문서에</span> <a style="color: #0275d8; font-size: 1.3em;" href="https://namu.wiki/w/%EC%8A%A4%ED%8F%AC%EC%9D%BC%EB%9F%AC" target="_blank" rel="noopener">스포일러</a><span style="font-size: 1.3em;">가 포함되어 있습니다.</span><br /><br />이 문서가 설명하는 작품이나 인물 등에 대한 줄거리, 결말, 반전 요소 등을 직·간접적으로 포함하고 있습니다.</td></tr></tbody></table>\n`;
                    break;
                case 'image':
                    const imgSrc = block.querySelector('.media-url').value.trim();
                    const imgBorderColor = block.querySelector('.media-border-color').value;
                    const imgDescEnabled = block.querySelector('.desc-enabled')?.checked || false;
                    const imgDescCell = block.querySelector('.media-description-cell');
                    const imgDescription = imgDescCell ? imgDescCell.innerHTML.trim() : '';
                    const imgDescBg = block.querySelector('.desc-bg-color')?.value || imgBorderColor;
                    const imgDescTextColor = block.querySelector('.desc-text-color')?.value || '#ffffff';
                    
                    if (imgSrc) {
                        if (imgDescEnabled && imgDescription) {
                            bodyHTML += `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${imgBorderColor};"><img src="${imgSrc}"></td></tr><tr><td style="background-color: ${imgDescBg}; color: ${imgDescTextColor}; border-color: ${imgBorderColor}; padding: 5px 10px; text-align: center; word-wrap: break-word; white-space: normal; vertical-align: top; line-height: 1.5;">${imgDescription}</td></tr></tbody></table>\n`;
                        } else {
                            bodyHTML += `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${imgBorderColor};"><img src="${imgSrc}"></td></tr></tbody></table>\n`;
                        }
                    }
                    break;
                case 'youtube':
                    const youtubeSrcRaw = block.querySelector('.media-url').value.trim();
                    const ytBorderColor = block.querySelector('.media-border-color').value;
                    const ytDescEnabled = block.querySelector('.desc-enabled')?.checked || false;
                    const ytDescCell = block.querySelector('.media-description-cell');
                    const ytDescription = ytDescCell ? ytDescCell.innerHTML.trim() : '';
                    const ytDescBg = block.querySelector('.desc-bg-color')?.value || ytBorderColor;
                    const ytDescTextColor = block.querySelector('.desc-text-color')?.value || '#ffffff';
                    const youtubeEmbedSrc = getYoutubeEmbedUrl(youtubeSrcRaw);
                    
                    if (youtubeEmbedSrc) {
                        if (ytDescEnabled && ytDescription) {
                            bodyHTML += `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${ytBorderColor};"><iframe src="${youtubeEmbedSrc}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameborder="0" allowfullscreen="true"></iframe></td></tr><tr><td style="background-color: ${ytDescBg}; color: ${ytDescTextColor}; border-color: ${ytBorderColor}; padding: 5px 10px; text-align: center; word-wrap: break-word; white-space: normal; vertical-align: top; line-height: 1.5;">${ytDescription}</td></tr></tbody></table>\n`;
                        } else {
                            bodyHTML += `<table class="wiki-img-sing"><tbody><tr><td style="border-color: ${ytBorderColor};"><iframe src="${youtubeEmbedSrc}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" frameborder="0" allowfullscreen="true"></iframe></td></tr></tbody></table>\n`;
                        }
                    }
                    break;
            }
        }
    });

    if (openDetails) {
        bodyHTML += `</details>\n`;
    }
    return bodyHTML;
}

function generateIndexHTML() {
    const blocks = document.querySelectorAll("#editor-container .editable-block");
    let h1Index = 0, h2Index = 0, h3Index = 0;
    let indexContent = '';

    blocks.forEach(block => {
        const type = block.dataset.type;
        if (type.startsWith('h')) {
            const level = type.charAt(1);
            const textHTML = block.querySelector(`[contenteditable]`).innerHTML.trim();
            if (!textHTML) return;

            if (level === "1") {
                h1Index++; h2Index = 0; h3Index = 0;
            } else if (level === "2") {
                h2Index++; h3Index = 0;
            } else if (level === "3") {
                h3Index++;
            }
            const indexText = level === "1" ? `${h1Index}.` : (level === "2" ? `${h1Index}.${h2Index}` : `${h1Index}.${h2Index}.${h3Index}`);
            const anchor = `목차${indexText.replace(/\./g, "-")}`;
            const indent = level === "1" ? 0 : (level === "2" ? 20 : 40);
            indexContent += `<a style="padding-left: ${indent}px;" href="#${anchor}">${indexText}</a> ${textHTML}<br />\n`;
        }
    });
    
    if(!indexContent) return '';

    return `
        <table class="wiki-index">
        <tbody>
        <tr style="padding: 0 20px;">
        <td style="width: 100%; margin-left: 5px; padding: 12px 20px 18px 20px; font-size: .95rem; line-height: 1.5;">
        <a name="목차"></a><span style="font-size: 1.25em; margin-left: -5px;">목차</span><br />
        ${indexContent}
        </td></tr></tbody></table>`;
}

document.getElementById("help-button").addEventListener("click", () => {
  document.getElementById("help-popup").classList.toggle("hidden");
});
document.getElementById("close-help").addEventListener("click", () => {
  document.getElementById("help-popup").classList.add("hidden");
});
document.getElementById("help-popup").addEventListener("click", (e) => {
  if (e.target === document.getElementById("help-popup")) {
    document.getElementById("help-popup").classList.add("hidden");
  }
});

function saveData() {
  const data = {
    mainColor: document.getElementById("mainColorPicker").value,
    charName: document.getElementById("charName").value,
    jpSurname: document.getElementById("jpSurname").value,
    jpSurnameFurigana: document.getElementById("jpSurnameFurigana").value,
    jpName: document.getElementById("jpName").value,
    jpNameFurigana: document.getElementById("jpNameFurigana").value,
    enName: document.getElementById("enName").value,
    imageUrl: document.getElementById("imageUrl").value,
    copyright: document.getElementById("copyright").value,
    categoryText: document.getElementById("categoryText").value,
    categoryLink: document.getElementById("categoryLink").value,
    fields: Array.from(document.querySelectorAll(".field-row")).map(row => ({
      name: row.querySelector(".field-name").value,
      value: row.querySelector(".field-value").value
    })),
    bodyContent: Array.from(document.querySelectorAll("#editor-container .editable-block")).map(block => {
        const type = block.dataset.type;
        const item = { type };
        switch (type) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'text':
                item.content = block.querySelector('[contenteditable]').innerHTML;
                break;
            case 'quote':
                item.content = block.querySelector('.quote-content').innerHTML;
                item.color = block.querySelector('.quote-color-picker').value;
                break;
            case 'quote2':
                item.dialog = block.querySelector('.quote2-dialog').innerHTML;
                item.desc = block.querySelector('.quote2-desc').innerHTML;
                item.link = block.querySelector('.quote2-link').value;
                item.color = block.querySelector('.quote-color-picker').value;
                break;
            case 'warn':
                break;
            case 'image':
            case 'youtube':
                item.url = block.querySelector('.media-url').value;
                item.borderColor = block.querySelector('.media-border-color').value;
                item.hasDescription = block.querySelector('.desc-enabled')?.checked || false;
                const descCell = block.querySelector('.media-description-cell');
                item.description = descCell ? descCell.innerHTML : '';
                item.descriptionBg = block.querySelector('.desc-bg-color')?.value || item.borderColor;
                item.descriptionTextColor = block.querySelector('.desc-text-color')?.value || '#ffffff';
                break;
        }
        return item;
    })
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const charName = document.getElementById("charName").value.trim() || "profile";
  a.href = url;
  a.download = `${charName}_data.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);

    if (data.mainColor) {
      document.getElementById("mainColorPicker").value = data.mainColor;
      document.querySelector(".color-display").style.backgroundColor = data.mainColor;
    }

    document.getElementById("charName").value = data.charName || "";
    document.getElementById("jpSurname").value = data.jpSurname || "";
    document.getElementById("jpSurnameFurigana").value = data.jpSurnameFurigana || "";
    document.getElementById("jpName").value = data.jpName || "";
    document.getElementById("jpNameFurigana").value = data.jpNameFurigana || "";
    document.getElementById("enName").value = data.enName || "";
    document.getElementById("imageUrl").value = data.imageUrl || "";
    document.getElementById("copyright").value = data.copyright || "";
    document.getElementById("categoryText").value = data.categoryText || "";
    document.getElementById("categoryLink").value = data.categoryLink || "";

    const fieldList = document.getElementById("field-list");
    fieldList.innerHTML = "";
    (data.fields || []).forEach(item => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.innerHTML = `
        <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
        <input class="field-name" value="${item.name}" placeholder="항목명" />
        <input class="field-value" value="${item.value}" placeholder="내용" />
      `;
      fieldList.appendChild(row);
    });

    const editorContainer = document.getElementById("editor-container");
    editorContainer.innerHTML = "";
    if (data.bodyContent && data.bodyContent.length > 0) {
        data.bodyContent.forEach(item => {
            addBlock(item.type, item);
        });
    }

    debouncedGenerateHTML();
  };
  
  reader.readAsText(file);
  event.target.value = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const inputSection = document.getElementById('input-section');
    const header = document.querySelector('.input-header');
    const toolbar = document.getElementById('body-toolbar');
    
    let lastScrollTop = 0;
    const delta = 5; 

    inputSection.addEventListener('scroll', () => {
        const currentScrollTop = inputSection.scrollTop;

        if (currentScrollTop > 10) {
            toolbar.classList.add('scrolled');
        } else {
            toolbar.classList.remove('scrolled');
        }
        
        if (Math.abs(lastScrollTop - currentScrollTop) <= delta) return;

        if (currentScrollTop > lastScrollTop && currentScrollTop > 60) {
            header.classList.add('hide');
            if(toolbar) toolbar.classList.add('move-up');
        } 
        else {
            header.classList.remove('hide');
            if(toolbar) toolbar.classList.remove('move-up');
        }

        lastScrollTop = currentScrollTop;
    });
});
