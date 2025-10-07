//-----------------Export::Print--------------
function printDiv(id) {
    var printContents = document.getElementById(id).innerHTML;
    var originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;

    window.print();
    document.body.innerHTML = originalContents;

    
}
//-----------------Export::Excel--------------

function fnExcelReport(id) {
    var tab_text = "<table border='2px'><tr bgcolor='#87AFC6'>";
    var textRange; var j = 0;
    tab = document.getElementById(id); // id of table
    for (j = 0; j < tab.rows.length; j++) {
        
        var cellText = $(tab.rows[j]).find("td:eq(1)");
        tab_text = tab_text + tab.rows[j].innerHTML + "</tr>";  
        
        //tab_text=tab_text+"</tr>";
    }

    tab_text = tab_text + "</table>";
    tab_text = tab_text.replace(/<A[^>]*>|<\/A>/g, "");//remove if u want links in your table
    tab_text = tab_text.replace(/<img[^>]*>/gi, ""); // remove if u want images in your table
    tab_text = tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params

    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    var sa = ""
    RefreshEPC();

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
    {
        txtArea1.document.open("txt/html", "replace");
        txtArea1.document.write(tab_text);
        txtArea1.document.close();
        txtArea1.focus();
         sa = txtArea1.document.execCommand("SaveAs", true, "Say Thanks to Sumit.xlsx");
    }
    else                 //other browser not tested on IE 11
        sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));

    return (sa);
}

//-------------------Export::SCV--------------
const toCsv = function (table) {
    // Query all rows
    const rows = table.querySelectorAll('tr');

    return [].slice.call(rows)
        .map(function (row) {
            // Query all cells
            const cells = row.querySelectorAll('th,td');
            return [].slice.call(cells)
                .map(function (cell) {
                    return cell.textContent;
                })
                .join(',');
        })
        .join('\n');
};
const download = function (text, fileName) {
    const link = document.createElement('a');
    link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(text)}`);
    link.setAttribute('download', fileName);

    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
};
function ExportSCV(id,filename) {
    const table = document.getElementById(id);
    const csv = toCsv(table);

    // Download it
    download(csv, filename);
}


//-------------------Export::PDF--------------
    function demoFromHTML(id) {
            var pdf = new jsPDF('p', 'pt', 'letter');
    // source can be HTML-formatted string, or a reference
    // to an actual DOM element from which the text will be scraped.
        source = $('#'+id+'')[0];

    // we support special element handlers. Register them with jQuery-style 
    // ID selector for either ID or node name. ("#iAmID", "div", "span" etc.)
    // There is no support for any other type of selectors 
    // (class, of compound) at this time.
    specialElementHandlers = {
        // element with id of "bypass" - jQuery style selector
        '#bypassme': function(element, renderer) {
                    // true = "handled elsewhere, bypass text extraction"
                    return true
                }
            };
    margins = {
        top: 80,
    bottom: 60,
    left: 40,
    width: 522
            };
    // all coords and widths are in jsPDF instance's declared units
    // 'inches' in this case
    pdf.fromHTML(
    source, // HTML string or DOM elem ref.
    margins.left, // x coord
    margins.top, {// y coord
        'width': margins.width, // max width of content on PDF
    'elementHandlers': specialElementHandlers
                    },
    function(dispose) {
        // dispose: object with X, Y of the last line add to the PDF 
        //          this allow the insertion of new lines after html
        pdf.save('Test.pdf');
            }
        , margins);
        }

//convert date string
function ConvertJsonDateString(jsonDate) {
    var shortDate = null;
    if (jsonDate) {
        var regex = /-?\d+/;
        var matches = regex.exec(jsonDate);
        var dt = new Date(parseInt(matches[0]));
        var month = dt.getMonth() + 1;
        var monthString = month > 9 ? month : '0' + month;
        var day = dt.getDate();
        var dayString = day > 9 ? day : '0' + day;
        var year = dt.getFullYear();
        shortDate = monthString + '/' + dayString + '/' + year;
    }
    return shortDate;
};

//-----------validate::Iduser------

function ValidateId() {
    var ids = $('input[name="id"]').val().trim();
        var id = ('000000' + ids).slice(-7)
        $('input[name="id"]').val(id)
}
//-----------validate::Iduser------
function ValidateMoney(id) {
    var currencyInput = document.getElementById(id)
    var currency = 'VND' // https://www.currency-iso.org/dam/downloads/lists/list_one.xml

    // format inital value
    onBlur({ target: currencyInput })

    // bind event listeners
    currencyInput.addEventListener('focus', onFocus)
    currencyInput.addEventListener('blur', onBlur)


    function localStringToNumber(s) {
        return Number(String(s).replace(/[^0-9.-]+/g, ""))
    }

    function onFocus(e) {
        var value = e.target.value;
        e.target.value = value ? localStringToNumber(value) : ''
    }

    function onBlur(e) {
        var value = e.target.value

        var options = {
            maximumFractionDigits: 2,
            currency: currency,
            style: "currency",
            currencyDisplay: "symbol"
        }

        e.target.value = (value || value === 0)
            ? localStringToNumber(value).toLocaleString(undefined, options)
            : ''
    }
}



//-----------validate::Email------
function validateEmail(email) {
    const res = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g.test(email);
    if (res == false) {
        alert("Vui Lòng Nhập Đúng Định Dạng Email")
        return false;
    }
}

//--------------Authorization-----------------
//---QuanLyDanhMucChinh
/*$.ajax({
    url: '/authorization/UserNV',
    type: 'get',
    success: function (data) {
        console.log(data);
        if (data.code == 201) {
            $('#discountgoods').attr('disabled', 'disabled')
        }
        if (data.code == 200) {
            $(document).on('click', 'a[name="ManageMainCategories"]', function (e) {
                toastr.error("Bạn Không Có Quyền !!!")
                e.preventDefault();
            })
        }
        else if (data.code == 300) {

        } 
        else {
            toastr(data.msg)
        }
    }
})*/
//--phanquyencheckstock
//$.ajax({
//    url: 'authorization/CheckStock',
//    type: 'get',
//    success: function (data) {
//        if (data.code == 200) {
//            $('#kt_quick_panel_toggle').hide();
//        }
//        else if (data.code == 300) {
//            $('#kt_quick_panel_toggle').show();
//        }
//        else {
//            toastr(data.msg)
//        }
//    }
//})
//---QuanLyMuaHang
$.ajax({
    url: '/authorization/PurchaseManager',
    type: 'get',
    success: function (data) {
        if (data.code == 400) {
            $(document).on('click', 'a[name="PurchaseManager"]', function (e) {
                toastr.error("Bạn Không Có Quyền !!!")
                e.preventDefault();
            })
        }
        else if (data.code == 500) {
            $(document).on('click', 'a[name="PurchaseManager"]', function (e) {
                toastr.error("Lỗi hệ thống !!!")
                e.preventDefault();
            })
        }
    }
})
//---QuanLyBanHang
$.ajax({
    url: '/authorization/SalesManager',
    type: 'get',
    success: function (data) {
        if (data.code == 400) {
            $(document).on('click', 'a[name="SalesManager"]', function (e) {
                toastr.error("Bạn Không Có Quyền !!!")
                e.preventDefault();
            })
        }
        else if (data.code == 500) {
            $(document).on('click', 'a[name="SalesManager"]', function (e) {
                toastr.error("Lỗi hệ thống !!!")
                e.preventDefault();
            })
        }
    }
})
//---QuanlyTaiKhoan
$.ajax({
    url: '/authorization/AccountManager',
    type: 'get',
    success: function (data) {
        console.log(data);
        if (data.code == 400) {
            $(document).on('click', 'a[name="AccountManager"]', function (e) {
                toastr.error("Bạn Không Có Quyền !!!")
                e.preventDefault();
            })
        }
        else if (data.code == 500) {
            $(document).on('click', 'a[name="AccountManager"]', function (e) {
                toastr.error("Lỗi hệ thống !!!")
                e.preventDefault();
            })
        }
    }
})
//---QuanLyKhoHang
$.ajax({
    url: '/authorization/WarehouseManagement',
    type: 'get',
    success: function (data) {
        console.log(data);
        if (data.code == 400 || data.code == 500) {
            $(document).on('click', 'a[name="WarehouseManagement"]', function (e) {
                toastr.error("Bạn Không Có Quyền !!!")
                e.preventDefault();
            })
        }
        else {
        }
    }
})
//----Quản lý hàng hóa, danh mục
$.ajax({
    url: '/authorization/ManageMainCategories',
    type: 'get',
    success: function (data) {
        console.log(data);
        if (data.code === 500 || data.code === 400) {
            console.log("oke");
            $(document).on('click', 'a[name="ManageMainCategories"]', function (e) {
            
                toastr.error("Bạn Không Có Quyền !!!")
                e.preventDefault();
            })
        }
        else {

        }
    }
})

//---- QuanLyHeThong
$.ajax({
    url: '/authorization/SystemManagement',
    type: 'get',
    success: function (data) {
        if (data.code === 500 || data.code === 400) {
            $(document).on('click', 'a[name="SystemManagement"]', function (e) {

                toastr.error("Bạn Không Có Quyền !!!")
                e.preventDefault();
            })
        }
        else {

        }
    }
})

/*---------------SignOut----------------*/
$(document).on('click', "a[name='signout']", function () {
    $.ajax({
        url: '/base/SignOut',
        type: 'get',
        success: function (data) {
            if (data.code == 200) {
                window.location.href = "/Login/Login"
            }
            else {
                toastr(data.msg)
            }
        }
    })
})

// Create our number formatter.
function Money(money) {
    var formatter = new Intl.NumberFormat('en-vi', {
        style: 'currency',
        currency: 'VND',

    });

    var res = formatter.format(money);
    return res;
}
//-----------convert money to text=------------------

const defaultNumbers = ' hai ba bốn năm sáu bảy tám chín';

const chuHangDonVi = ('1 một' + defaultNumbers).split(' ');
const chuHangChuc = ('lẻ mười' + defaultNumbers).split(' ');
const chuHangTram = ('không một' + defaultNumbers).split(' ');

//--------------number convert text--------------
function convert_block_three(number) {
    if (number == '000') return '';
    var _a = number + ''; //Convert biến 'number' thành kiểu string

    //Kiểm tra độ dài của khối
    switch (_a.length) {
        case 0: return '';
        case 1: return chuHangDonVi[_a];
        case 2: return convert_block_two(_a);
        case 3:
            var chuc_dv = '';
            if (_a.slice(1, 3) != '00') {
                chuc_dv = convert_block_two(_a.slice(1, 3));
            }
            var tram = chuHangTram[_a[0]] + ' trăm';
            return tram + ' ' + chuc_dv;
    }
}

function convert_block_two(number) {
    var dv = chuHangDonVi[number[1]];
    var chuc = chuHangChuc[number[0]];
    var append = '';

    // Nếu chữ số hàng đơn vị là 5
    if (number[0] > 0 && number[1] == 5) {
        dv = 'lăm'
    }

    // Nếu số hàng chục lớn hơn 1
    if (number[0] > 1) {
        append = ' mươi';

        if (number[1] == 1) {
            dv = ' mốt';
        }
    }

    return chuc + '' + append + ' ' + dv;
}
const dvBlock = '1 nghìn triệu tỷ'.split(' ');

function to_vietnamese(number) {
    var str = parseInt(number) + '';
    var i = 0;
    var arr = [];
    var index = str.length;
    var result = [];
    var rsString = '';

    if (index == 0 || str == 'NaN') {
        return '';
    }

    // Chia chuỗi số thành một mảng từng khối có 3 chữ số
    while (index >= 0) {
        arr.push(str.substring(index, Math.max(index - 3, 0)));
        index -= 3;
    }

    // Lặp từng khối trong mảng trên và convert từng khối đấy ra chữ Việt Nam
    for (i = arr.length - 1; i >= 0; i--) {
        if (arr[i] != '' && arr[i] != '000') {
            result.push(convert_block_three(arr[i]));

            // Thêm đuôi của mỗi khối
            if (dvBlock[i]) {
                result.push(dvBlock[i]);
            }
        }
    }

    // Join mảng kết quả lại thành chuỗi string
    rsString = result.join(' ');

    // Trả về kết quả kèm xóa những ký tự thừa
    return rsString.replace(/[0-9]/g, '').replace(/ /g, ' ').replace(/ $/, '');
}

//ma so thue
function getInfoFromTax() {
    try {
        var taxCode = $("#taxCode").val().trim();
        if (taxCode.length >= 10) {
            $.ajax({
                url: "https://api.vietqr.io/v2/business/" + taxCode,
                type: "GET",
                dataType: "json",
                contentType: "application/json",
                success: function (response) {
                    $('input[name="address"]').val(response.data.address)
                    $('input[name="name"]').val(response.data.name)
                },
                error: function (xhr, status, error) {
                    // Xử lý lỗi
                    console.error(error);
                }
            });
        }
    } catch(error) {
        console.error(error);
    }
}
function formatDate(jsonDate) {
    if (jsonDate == null)
        return ""
    jsonDate = jsonDate.substr(6)
    var date = jsonTodDate(jsonDate)
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-');
}
function formatDateTime(jsonDate) {
    if (jsonDate == null)
        return ""
    jsonDate = jsonDate.substr(6);
    var date = jsonTodDate(jsonDate);

    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-') + ' ' + [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
    ].join(':');
}
function jsonTodDate(jsonDate) {

    const backToDate = new Date(parseInt(jsonDate));
    return backToDate;
}
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-full-width",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "show",
    "hideMethod": "slideUp"
};