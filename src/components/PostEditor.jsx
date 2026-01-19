import { useState, useRef } from 'react'
import RichTextEditor from './RichTextEditor'
import './PostEditor.css'

function PostEditor({ post = null, onSave, onCancel, baseUrl, userToken }) {
    const [title, setTitle] = useState(post?.title || '')
    const [type, setType] = useState(post?.type || 'work')
    const [content, setContent] = useState(post?.content || '') // Only for initial load
    const contentRef = useRef(post?.content || '') // Use ref to track current content without re-rendering editor

    const handleSave = () => {
        const postData = {
            id: post?.id || Date.now(),
            type,
            title,
            content: contentRef.current,
            date: post?.date || new Date().toISOString()
        }
        onSave(postData)
    }

    const handleContentChange = (newContent) => {
        contentRef.current = newContent
    }

    return (
        <div className="post-editor-overlay">
            <div className="post-editor-modal">
                <div className="post-editor-header">
                    <h2>{post ? '編輯文章' : '新增文章'}</h2>
                    <button className="close-btn" onClick={onCancel}>✕</button>
                </div>

                <div className="post-editor-content">
                    {/* Title */}
                    <div className="form-group">
                        <label>標題</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="輸入文章標題..."
                            className="form-input"
                        />
                    </div>

                    {/* Type */}
                    <div className="form-group">
                        <label>類型</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="form-select"
                        >
                            <option value="work">作品，文章</option>
                            <option value="program">小程式</option>
                        </select>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="form-group">
                        <label>內容</label>
                        <RichTextEditor
                            initialContent={content}
                            onChange={handleContentChange}
                            baseUrl={baseUrl}
                            userToken={userToken}
                        />
                    </div>
                </div>

                <div className="post-editor-footer">
                    <button className="cancel-btn" onClick={onCancel}>
                        取消
                    </button>
                    <button className="save-btn" onClick={handleSave}>
                        {post ? '更新' : '發佈'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PostEditor
