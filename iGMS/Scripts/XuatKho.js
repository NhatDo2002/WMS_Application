$('#idsaleorder').keyup(function () {
    Show()
})

function Show() {
    var id = $('#idsaleorder').val().trim().substring(5)
    $.ajax({
        url: '/detailwarehouse/Show2',
        type: 'get',
        data: {
            id
        },
        success: function (data) {
            $('span[name="K"]').empty()
            $('span[name="customer"]').empty()
            $('tbody[name="tbd"]').empty()
            var Stt=1
            if (data.code == 200) {
                $.each(data.a, function (k, v) {
                    $('span[name="K"]').append(v.K)
                    $('span[name="K"]').attr('id',v.Kid)
                    $('span[name="customer"]').append(v.customer)
                })
                $.each(data.c, function (k, v) {
                    var ids = $('.IDSA').map(function () {
                        return this.id;
                    }).get();
                    if (ids.includes(v.idgood)) {
                        var amounts = $('#amountresult' + v.idgood + '').text();
                        $('#amountresult' + v.idgood + '').empty();
                        $('#amountresult' + v.idgood + '').append(Number(amounts) + 1);
                    } else {
                        let table = '<tr id="' + v.idgood + '" class="donhang IDSA">'
                        table += '<td style="background:red" id="result' + v.idgood + '">0</td>'
                        table += '<td>' + (Stt++) + '</td>'
                        table += '<td hidden>' + v.idgood + '</td>'
                        table += '<td>' + v.idgood + '</td>'
                        table += '<td>' + v.name + '</td>'
                        table += '<td>' + v.style + '</td>'
                        table += '<td>' + v.size + '</td>'
                        table += '<td>' + v.color + '</td>'
                        table += '<td id="amountresult' + v.idgood + '">1</td></tr>'
                        $('tbody[name="tbd"]').append(table)
                    }

                })
            }  else {
                alert(data.msg)
            }
        }
    })
}

function CompareReceipt(barcodes) {
    var barcode = '';
    $.ajax({
        url: '/receipt/ChangeGood',
        type: 'get',
        data: {
            barcodes
        },
        success: function (data) {
            if (data.code == 200) {
                $.each(data.c, function (k, v) {
                    barcode = v.idgood;
                    var amounttext = $('#result' + barcode + '').text();
                    var amountresulttext = $('#amountresult' + barcode + '').text();
                    var amount = Number(amounttext)
                    var amountresult = Number(amountresulttext)
                    var GoodPucharseOder = $('.donhang').map(function () {
                        return this.id;
                    })
                    for (var i = 0; i < GoodPucharseOder.length; i++) {
                        if (GoodPucharseOder[i] == barcode) {
                            amount += 1;
                            if (amount > amountresult) {
                                return;
                            } else {
                                $('#result' + barcode + '').text(amount)
                            }
                            if (amount == amountresult) {
                                $('#result' + barcode + '').css('background', 'green')
                            } else if (amount < amountresult) {
                                $('#result' + barcode + '').css('background', '#ffa800')
                            } else if (amount <= 0) {
                                $('#result' + barcode + '').css('background', 'red')
                            }
                        }
                    }
                })
            } else if (data.code == 300) {
                alert(data.msg)
            }
        }
    })

}

//------------

function Add() {
    Stop()
    var ids = $('.donhang').map(function () {
        return this.id
    }).get();
    var id = $('#id').val().trim();
    var idsaleorder = $('input[name="idsalesorder"]').val();
  /*  var idsaleorder = $('#saleorder').val().trim().substring(5)*/
    var id = ""
    for (let i = 0; i < ids.length; i++) {
        id = ids[i]
        var amount = $('#result' + id + '').text()
        var K = $('span[name="K"]').attr('id');
        $.ajax({
            url: '/detailwarehouse/Tru',
            type: 'post',
            data: {
                id, idsaleorder, amount, K, epcshow
            },
            beforeSend: function () {
                $("#wait").css("display", "block");
            },
            success: function (data) {
                if (data.code == 200) {
                    epcshow = []
                    window.location.href = "/DetailWareHouse/Index2"
                }
                else if (data.code == 1) {
                    alert(data.msg)
                } else {
                    alert(data.msg)
                }
            },
            complete: function () {
                $("#wait").css("display", "none");
            }
        })
    }  
}

//-----------------------------
$(document).scannerDetection({
    timeBeforeScanTest: 200, // wait for the next character for upto 200ms
    startChar: [120],
    endChar: [13], // be sure the scan is complete if key 13 (enter) is detected
    avgTimeByChar: 40, // it's not a barcode if a character takes longer than 40ms
    ignoreIfFocusOn: 'input', // turn off scanner detection if an input has focus
    minLength: 1,
    onComplete: function (barcode, qty) {
        CompareReceipt(barcode)

    }, // main callback function
    scanButtonKeyCode: 116, // the hardware scan button acts as key 116 (F5)
    scanButtonLongPressThreshold: 5, // assume a long press if 5 or more events come in sequence
    onError: function (string) { alert('Error ' + string); }
});

var start;

function RFID() {
    $('.on').css('display', 'none')
    $('.off').css('display', 'block')
    setInterval(function () { AllShowEPC() }, 200);
}
function Stop() {
    $('.on').css('display', 'block')
    $('.off').css('display', 'none')
    clearInterval(start);
}
var epcshow = [];
function AllShowEPC() {
    $.ajax({
        url: '/rfid/AllShowEPC',
        type: 'get',
        success: function (data) {
            if (data.code == 200) {
                $.each(data.a, function (k, v) {
                    epcshow.push(v.id)
                    CompareReceiptrfid(v.id)
                })
            }
        }
    })
}
function CompareReceiptrfid(epc) {
    $.ajax({
        url: '/rfid/CompareReceipt',
        type: 'get',
        data: {
            epc
        },
        success: function (data) {
            if (data.code == 200) {
                $.each(data.a, function (k, v) {
                    CompareReceipt(v.idgood)
                })

            }
        }
    })
}

