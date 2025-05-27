export async function APIService(path, body = null, method = 'GET') {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(path, options);
    return handleResponse(response);
}

async function handleResponse(response) {
    // 处理json响应
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}


/*
path: '/paste',
method: 'POST',
body: clipboardState = {
    actionType: null,
    sourcePath: null,
    destinationPath: null,
    items: []
};
returns: fileList; [{ name: 'file1.txt', modified: '', type: 'file or dir', size: 1234, path: 'path/to/file'}, ...]

path: '/create_file',
method: 'POST',
body: { name: 'new_file.txt', path: 'path/to/directory'}
returns: fileList;

path: '/create_dir',
method: 'POST',
body: { name: 'new_directory', path: 'path/to/directory'}
returns: fileList;

path: '/rename',
method: 'POST',
body: { old_name: 'old_file.txt', new_name: 'new_file.txt', path: 'path/to/directory'}
returns: fileList;

path: '/delete',
method: 'POST',
body: [path: 'path', { name: 'file_to_delete.txt', type: 'file'}, { name: 'directory_to_delete', type: 'dir'}, ...]
returns: fileList;

path: '/get_files',
method: 'POST',
body: { path : 'path/to/directory'}
returns: fileList;

path: '/get_parent_path_files',
method: 'POST',
body: { path: 'path/to/directory'}
returns: [{ name: '..', type: 'dir', path: 'path/to/parent_directory' }, ..., 'path/to/directory']]

path: '/search_files',
method: 'POST',
body: { path: 'path/to/directory', search_term: 'search_term'}
returns: fileList;

...

*/
