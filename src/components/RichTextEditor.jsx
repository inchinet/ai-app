import { useState, useRef, useEffect } from 'react'
import './RichTextEditor.css'

function RichTextEditor({ initialContent = '', onChange, baseUrl = 'http://localhost:3001', userToken }) {
    const editorRef = useRef(null)
    const [textColor, setTextColor] = useState('#ffffff')
    const [bgColor, setBgColor] = useState('#ffffff')
    const [fontSize, setFontSize] = useState('16')
    const [fontFamily, setFontFamily] = useState('Inter')

    const savedRange = useRef(null)

    // Initialize content ONLY ONCE when component mounts
    // This prevents "ghost content" where React re-renders with stale props
    // overwriting user's local edits.
    useEffect(() => {
        if (editorRef.current && initialContent) {
            // Only set if empty to avoid overwriting if parent re-renders unexpectedly
            // However, if we are switching posts, we might want to reset. 
            // But for now, user is typing happily.
            if (editorRef.current.innerHTML === '') {
                editorRef.current.innerHTML = initialContent
            }
        }
    }, [initialContent]) // Dependency on initialContent so if we switch posts it might update if empty

    // Save current selection - wrapper to safely get range
    const saveSelection = () => {
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
            savedRange.current = selection.getRangeAt(0)
        }
    }

    // Restore saved selection
    const restoreSelection = () => {
        if (savedRange.current) {
            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(savedRange.current)
        }
    }

    // Execute formatting command
    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value)
        // Keep focus in editor
        if (editorRef.current) {
            editorRef.current.focus()
            handleInput()
        }
    }

    // Handle toolbar mouse down
    // We want to prevent default for BUTTONS so focus stays in editor.
    // We must NOT prevent default for INPUTS/SELECTS so they can be clicked.
    const handleToolbarMouseDown = (e) => {
        const tagName = e.target.tagName

        // Always save selection when interacting with toolbar
        // This ensures we know where to put an image if the user clicks the upload button
        saveSelection()

        // If clicking an input, select, or label wrapping them, do NOT prevent default
        if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'LABEL') {
            return
        }
        e.preventDefault()
    }

    // Handle text color change
    const handleTextColor = (color) => {
        setTextColor(color)
        execCommand('foreColor', color)
    }

    // Handle background color change
    const handleBgColor = (color) => {
        setBgColor(color)
        execCommand('hiliteColor', color)
    }

    // Handle font size change
    const handleFontSize = (size) => {
        setFontSize(size)
        // "7" is the maximum size for legacy font tag
        document.execCommand('fontSize', false, '7')

        // Replace the font tag or styled span with correct size
        const fontElements = editorRef.current.querySelectorAll('font[size="7"]')
        fontElements.forEach(el => {
            el.removeAttribute('size')
            el.style.fontSize = `${size}px`
            el.style.lineHeight = '1.4'
        })
        handleInput()
    }

    // Handle font family change
    const handleFontFamily = (family) => {
        setFontFamily(family)
        execCommand('fontName', family)
    }

    // Handle image insertion
    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const formData = new FormData()
            formData.append('file', file)

            fetch(`${baseUrl}api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                body: formData
            })
                .then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Upload failed');
                    return data;
                })
                .then(data => {
                    if (data.url) {
                        restoreSelection()
                        const imgUrl = `${baseUrl}${data.url}`
                        const img = `<img src="${imgUrl}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" alt="${file.name}" />`
                        execCommand('insertHTML', img)
                    }
                })
                .catch(err => {
                    console.error("Upload failed", err)
                    alert("Image Upload Failed: " + err.message)
                })
        }
        e.target.value = ''
    }

    // Handle video insertion
    const handleVideoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const formData = new FormData()
            formData.append('file', file)

            fetch(`${baseUrl}api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                body: formData
            })
                .then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Upload failed');
                    return data;
                })
                .then(data => {
                    if (data.url) {
                        restoreSelection()
                        const mediaUrl = `${baseUrl}${data.url}`
                        const isAudio = file.type.startsWith('audio/')
                        const mediaHtml = isAudio
                            ? `<audio controls style="width: 100%; margin: 10px 0;"><source src="${mediaUrl}" type="${file.type}"></audio><p><br/></p>`
                            : `<video controls style="max-width: 100%; height: auto; display: block; margin: 10px 0;"><source src="${mediaUrl}" type="${file.type}"></video><p><br/></p>`
                        execCommand('insertHTML', mediaHtml)
                    }
                })
                .catch(err => {
                    console.error("Upload failed", err)
                    alert("Video Upload Failed: " + err.message)
                })
        }
        e.target.value = ''
    }

    // Smart Link Handling:
    const handleLink = () => {
        const selection = window.getSelection()
        const selectedText = selection.toString()

        // Check if selected text looks like a URL
        const urlRegex = /^(http|https):\/\/[^ "]+$/

        if (selectedText && urlRegex.test(selectedText)) {
            execCommand('createLink', selectedText)
        } else {
            const url = prompt('輸入連結 URL (Enter Link URL):', 'http://')
            if (url) {
                execCommand('createLink', url)
            }
        }
    }

    // Handle YouTube link insertion
    const handleYouTubeLink = () => {
        const url = prompt('輸入 YouTube 連結:')
        if (url) {
            let videoId = ''
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1]?.split('&')[0]
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0]
            }

            if (videoId) {
                const iframe = `<div class="youtube-container" style="position: relative; padding-bottom: 56.25%; height: 0; margin: 10px 0;"><iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div><p><br/></p>`
                execCommand('insertHTML', iframe)
            } else {
                alert('無效的 YouTube 連結')
            }
        }
    }

    // Handle content change
    const handleInput = () => {
        if (onChange && editorRef.current) {
            onChange(editorRef.current.innerHTML)
        }
    }

    return (
        <div className="rich-text-editor">
            {/* Formatting Toolbar */}
            {/* CRITICAL: preventDefault only on buttons, not inputs */}
            <div className="editor-toolbar" onMouseDown={handleToolbarMouseDown}>

                {/* Text Formatting */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => execCommand('bold')}
                        title="粗體 (Bold)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => execCommand('italic')}
                        title="斜體 (Italic)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => execCommand('underline')}
                        title="底線 (Underline)"
                    >
                        <u>U</u>
                    </button>
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={handleLink}
                        title="連結 (Link) - 選取網址自動轉換"
                    >
                        🔗
                    </button>
                </div>

                {/* Color Pickers */}
                <div className="toolbar-group">
                    <label className="color-picker-label">
                        <span>文字顏色</span>
                        <input
                            type="color"
                            value={textColor}
                            onChange={(e) => handleTextColor(e.target.value)}
                            className="color-picker"
                        />
                    </label>
                    <label className="color-picker-label">
                        <span>背景顏色</span>
                        <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => handleBgColor(e.target.value)}
                            className="color-picker"
                        />
                    </label>
                </div>

                {/* Font Controls */}
                <div className="toolbar-group">
                    <select
                        value={fontFamily}
                        onChange={(e) => handleFontFamily(e.target.value)}
                        className="font-select"
                    >
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Verdana">Verdana</option>
                        <option value="微軟正黑體">微軟正黑體</option>
                        <option value="新細明體">新細明體</option>
                    </select>
                    <select
                        value={fontSize}
                        onChange={(e) => handleFontSize(e.target.value)}
                        className="font-select"
                    >
                        <option value="12">12px</option>
                        <option value="14">14px</option>
                        <option value="16">16px</option>
                        <option value="18">18px</option>
                        <option value="20">20px</option>
                        <option value="24">24px</option>
                        <option value="28">28px</option>
                        <option value="32">32px</option>
                        <option value="36">36px</option>
                    </select>
                </div>

                {/* Media Insertion */}
                <div className="toolbar-group">
                    <label className="toolbar-btn media-btn">
                        📷 圖片
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <label className="toolbar-btn media-btn">
                        🎬 影片/音訊
                        <input
                            type="file"
                            accept="video/*,audio/*"
                            onChange={handleVideoUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <button
                        type="button"
                        className="toolbar-btn media-btn"
                        onClick={handleYouTubeLink}
                    >
                        ▶️ YouTube
                    </button>
                </div>

                {/* Paragraph */}
                <div className="toolbar-group">
                    <button
                        type="button"
                        className="toolbar-btn"
                        onClick={() => execCommand('insertParagraph')}
                        title="分段"
                    >
                        ¶
                    </button>
                </div>
            </div>

            {/* Editor Content Area */}
            <div
                ref={editorRef}
                className="editor-content"
                contentEditable
                onInput={handleInput}
                suppressContentEditableWarning
            />
        </div>
    )
}

export default RichTextEditor
