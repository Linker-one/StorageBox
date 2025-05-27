let selectBtn, selectAllBtn;

export function initSelection() {
    selectBtn = document.querySelector('.toolbar .select');
    selectAllBtn = document.querySelector('.toolbar .select-all');

    selectBtn.addEventListener('click', handleSelect);
    selectAllBtn.addEventListener('click', handleSelectAll);
}

function handleSelect() {
    selectBtn.classList.toggle('active');

    if (!selectBtn.classList.contains('active')) {
        selectAllBtn.classList.remove('active');

        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.classList.remove('selected');
        });
    }
}

function handleSelectAll() {
    selectAllBtn.classList.toggle('active');

    const fileItems = document.querySelectorAll('.file-item');
    if (selectAllBtn.classList.contains('active')) {
        selectBtn.classList.add('active');
        fileItems.forEach(item => {
            item.classList.add('selected');
        });
    } else {
        selectBtn.classList.remove('active');
        fileItems.forEach(item => {
            item.classList.remove('selected');
        });
    }
}