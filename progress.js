const progress = document.getElementById('progress');
const loading = document.getElementById('loading');
const p1 =  document.getElementById('p1')
async function load_progress() {
    let that = this;
    let load = setInterval(function () {
        that.progress.value += 1;
        that.loading.innerText = that.progress.value
        if (that.progress.value >= 99) {
            that.p1.style.display = "none"
            clearInterval(load)
        }
    }, 200)

}