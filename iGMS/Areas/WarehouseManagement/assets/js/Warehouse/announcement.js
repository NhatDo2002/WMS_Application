var getIdWH = localStorage.getItem("idwarehouse");
var getIdGood = localStorage.getItem("idgoods");
console.log(getIdWH)
console.log(getIdGood)
if (getIdWH !== null) {
    console.log($(`button[data-record-id="${getIdWH}"]`))
    $(`button[data-record-id="${getIdWH}"]`).click();

    localStorage.removeItem("idwarehouse");

    if (getIdGood != null) {
        $(`button[data-record-id="${getIdGood}"]`).click();

        localStorage.removeItem("idgoods");
    }
}