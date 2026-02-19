#!/usr/bin/env python3
"""
Simple Git Web Interface
A lightweight web interface for browsing Git repositories
"""

import os
import sys
import subprocess
import cgi
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

REPO_PATH = "/root/.openclaw/workspace"
PORT = 3001

class GitHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        
        if path == '/' or path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(self.render_index().encode())
        elif path == '/api/files':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(self.get_files(query.get('path', [''])[0])).encode())
        elif path == '/api/file':
            filepath = query.get('path', [''])[0]
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(self.get_file_content(filepath).encode())
        elif path == '/api/commits':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(self.get_commits()).encode())
        elif path == '/api/diff':
            commit = query.get('commit', ['HEAD'])[0]
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(self.get_diff(commit).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def render_index(self):
        return '''<!DOCTYPE html>
<html>
<head>
    <title>Foundation Git Browser</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .header { background: #24292e; color: white; padding: 16px 24px; }
        .header h1 { font-size: 20px; }
        .container { display: flex; height: calc(100vh - 60px); }
        .sidebar { width: 300px; background: white; border-right: 1px solid #e1e4e8; overflow-y: auto; }
        .content { flex: 1; background: white; overflow-y: auto; padding: 24px; }
        .file-tree { padding: 16px; }
        .file-item { padding: 8px 12px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 8px; }
        .file-item:hover { background: #f6f8fa; }
        .file-item.folder { font-weight: 500; }
        .file-item.file { color: #586069; }
        .file-item i { width: 16px; text-align: center; }
        .breadcrumbs { padding: 16px; border-bottom: 1px solid #e1e4e8; font-size: 14px; }
        .breadcrumbs a { color: #0366d6; text-decoration: none; }
        .breadcrumbs a:hover { text-decoration: underline; }
        .file-content { background: #f6f8fa; border-radius: 6px; padding: 16px; overflow-x: auto; }
        .file-content pre { margin: 0; font-family: 'SF Mono', Monaco, monospace; font-size: 12px; line-height: 1.5; }
        .commits { padding: 16px; }
        .commit { padding: 12px; border-bottom: 1px solid #e1e4e8; }
        .commit:hover { background: #f6f8fa; }
        .commit-hash { font-family: monospace; color: #0366d6; font-size: 12px; }
        .commit-message { font-weight: 500; margin: 4px 0; }
        .commit-meta { font-size: 12px; color: #586069; }
        .tabs { display: flex; border-bottom: 1px solid #e1e4e8; }
        .tab { padding: 12px 24px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #f78166; color: #f78166; }
        .tab:hover { background: #f6f8fa; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .btn { padding: 6px 12px; background: #2ea44f; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .btn:hover { background: #2c974b; }
        .actions { padding: 16px; border-bottom: 1px solid #e1e4e8; }
        textarea { width: 100%; min-height: 400px; font-family: 'SF Mono', Monaco, monospace; font-size: 12px; padding: 12px; border: 1px solid #e1e4e8; border-radius: 6px; resize: vertical; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📁 Foundation Repository Browser</h1>
    </div>
    <div class="tabs">
        <div class="tab active" onclick="showTab('files')">Files</div>
        <div class="tab" onclick="showTab('commits')">Commits</div>
    </div>
    <div class="container">
        <div class="sidebar">
            <div id="file-tree" class="file-tree">Loading...</div>
        </div>
        <div class="content">
            <div id="tab-files" class="tab-content active">
                <div class="breadcrumbs" id="breadcrumbs">/</div>
                <div class="actions">
                    <button class="btn" onclick="saveFile()" id="save-btn" style="display:none">Save Changes</button>
                </div>
                <div id="file-viewer">
                    <p>Select a file to view its contents</p>
                </div>
            </div>
            <div id="tab-commits" class="tab-content">
                <div class="commits" id="commits">Loading...</div>
            </div>
        </div>
    </div>
    <script>
        let currentFile = null;
        let currentContent = null;
        
        function showTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelector(`.tab:nth-child(${tab === 'files' ? 1 : 2})`).classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
        }
        
        async function loadFiles(path = '') {
            const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            const files = await res.json();
            
            let html = '';
            if (path) {
                const parent = path.split('/').slice(0, -1).join('/');
                html += `<div class="file-item" onclick="loadFiles('${parent}')">📁 ..</div>`;
            }
            
            files.forEach(f => {
                const icon = f.type === 'dir' ? '📁' : '📄';
                const fullPath = path ? `${path}/${f.name}` : f.name;
                if (f.type === 'dir') {
                    html += `<div class="file-item folder" onclick="loadFiles('${fullPath}')">${icon} ${f.name}</div>`;
                } else {
                    html += `<div class="file-item file" onclick="loadFile('${fullPath}')">${icon} ${f.name}</div>`;
                }
            });
            
            document.getElementById('file-tree').innerHTML = html;
            document.getElementById('breadcrumbs').textContent = '/' + path;
        }
        
        async function loadFile(path) {
            currentFile = path;
            const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
            const content = await res.text();
            currentContent = content;
            
            const isEditable = !path.match(/\.(png|jpg|jpeg|gif|ico|woff|ttf|eot|svg|pdf|zip|tar|gz)$/i);
            
            if (isEditable) {
                document.getElementById('file-viewer').innerHTML = `<textarea id="editor">${escapeHtml(content)}</textarea>`;
                document.getElementById('save-btn').style.display = 'inline-block';
            } else {
                document.getElementById('file-viewer').innerHTML = `<div class="file-content"><pre>${escapeHtml(content)}</pre></div>`;
                document.getElementById('save-btn').style.display = 'none';
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        async function saveFile() {
            if (!currentFile) return;
            const content = document.getElementById('editor').value;
            
            // Note: Actual save would require a POST endpoint with git operations
            alert('Save functionality requires server-side git integration. Use git commands directly or the Web IDE at port 8080.');
        }
        
        async function loadCommits() {
            const res = await fetch('/api/commits');
            const commits = await res.json();
            
            let html = '';
            commits.forEach(c => {
                html += `
                    <div class="commit">
                        <div class="commit-hash">${c.hash.substring(0, 7)}</div>
                        <div class="commit-message">${escapeHtml(c.message)}</div>
                        <div class="commit-meta">${c.author} • ${c.date}</div>
                    </div>
                `;
            });
            
            document.getElementById('commits').innerHTML = html;
        }
        
        loadFiles();
        loadCommits();
    </script>
</body>
</html>'''
    
    def get_files(self, path):
        full_path = os.path.join(REPO_PATH, path)
        if not full_path.startswith(REPO_PATH):
            return []
        
        try:
            items = []
            for name in sorted(os.listdir(full_path)):
                if name.startswith('.'):
                    continue
                item_path = os.path.join(full_path, name)
                items.append({
                    'name': name,
                    'type': 'dir' if os.path.isdir(item_path) else 'file'
                })
            return items
        except:
            return []
    
    def get_file_content(self, path):
        full_path = os.path.join(REPO_PATH, path)
        if not full_path.startswith(REPO_PATH) or not os.path.isfile(full_path):
            return "File not found"
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            return str(e)
    
    def get_commits(self):
        try:
            result = subprocess.run(
                ['git', '-C', REPO_PATH, 'log', '--pretty=format:%H|%s|%an|%ad', '--date=short', '-20'],
                capture_output=True, text=True
            )
            commits = []
            for line in result.stdout.strip().split('\n'):
                if '|' in line:
                    parts = line.split('|', 3)
                    commits.append({
                        'hash': parts[0],
                        'message': parts[1],
                        'author': parts[2],
                        'date': parts[3]
                    })
            return commits
        except:
            return []
    
    def get_diff(self, commit):
        try:
            result = subprocess.run(
                ['git', '-C', REPO_PATH, 'show', commit],
                capture_output=True, text=True
            )
            return result.stdout
        except Exception as e:
            return str(e)
    
    def log_message(self, format, *args):
        pass  # Suppress default logging

def run():
    server = HTTPServer(('0.0.0.0', PORT), GitHandler)
    print(f"Git Web Server running at http://0.0.0.0:{PORT}")
    server.serve_forever()

if __name__ == '__main__':
    run()
