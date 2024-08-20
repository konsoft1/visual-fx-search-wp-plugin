function download() {
    let url = document.getElementById('download-btn').getAttribute('data-url');
    url += "&search_keyword=" + encodeURIComponent(document.getElementById('search-input').value);
    const downloadlink = document.getElementById('download-link');
    downloadlink.setAttribute('href', url);
    downloadlink.click();
}