let groupId = 1;

var KTCardDraggable = function () {
    return {
        //main function to initiate the module
        init: function () {
            var containers = document.querySelectorAll('.draggable-zone');

            if (containers.length === 0) {
                return false;
            }

            var swappable = new Sortable.default(containers, {
                draggable: '.draggable',
                handle: '.draggable',
                mirror: {
                    appendTo: 'body',
                    constrainDimensions: true
                }
            });
        }
    };
}();

jQuery(document).ready(function () {
    KTCardDraggable.init();
    if (localStorage.getItem("barcodeStructure") == null)
        localStorage.setItem("barcodeStructure", JSON.stringify(barcodeStructure))
    initStructure((localStorage.getItem("barcodeStructure")));
    /*ListPrinter("ip")*/
});

function initStructure(barcodeStructure) {
    var barcodeStructure = JSON.parse(barcodeStructure);
    $("#isSeperate").prop("checked", barcodeStructure.isSeparate)
    $("#delimiter").val(barcodeStructure.seperatorChar);
    $("#delimiter_new").val(barcodeStructure.seperatorChar);
    //$.each(barcodeStructure.structure, function (i, v) {
    //    var $p = "";

    //    if (v.status) {
    //        $p = $(`<p class="h6 draggable unDelete text" style="margin: 0; cursor: pointer;">${v.key}<span style="color:red">*</span></p>`);
    //    } else {
    //        $p = $(`<p class="h6 draggable text" data-group="${groupId}" style="margin: 0;cursor: pointer">${v.key}</p>`);
    //    }
    //    // Thêm field chính
    //    $('.p-list').append($p);

    //    // Nếu không phải phần tử cuối thì thêm delimiter
    //    if (i < barcodeStructure.structure.length - 1) {
    //        var $delimiter = "";
    //        if (v.status) {
    //            $delimiter = $(`<p class="delimiter" data-group="${groupId + 1}" style="margin: 0 6px;">${barcodeStructure.seperatorChar}</p>`);
    //        } else {
    //            $delimiter = $(`<p class="delimiter" data-group="${groupId}" style="margin: 0 6px;">${barcodeStructure.seperatorChar}</p>`);
    //        }
    //        $delimiter = $(`<p class="delimiter" data-group="${groupId}" style="margin: 0 6px;">${barcodeStructure.seperatorChar}</p>`);

    //        $('.p-list').append($delimiter);
    //    }
    //})
    let fixedIndex = barcodeStructure.structure.findIndex(item => item.status === true);
    var $container = $('.p-list');
    $.each(barcodeStructure.structure, function (i, v) {
        if (v.status === true) {
            const $fixed = $(`<p class="h6 draggable unDelete text" style="margin: 0; cursor: pointer;">${v.key}<span style="color:red">*</span></p>`);
            $container.append($fixed);
        } else {
            // Xác định hướng dựa vào vị trí tương đối với phần tử cố định
            const isBeforeFixed = i < fixedIndex;

            if (isBeforeFixed) {
                // field trước -> field trước, delimiter sau
                const $field = $(`<p class="h6 draggable text" data-group="${groupId}" style="margin: 0; cursor: pointer;">${v.key}</p>`);
                $container.append($field);

                // delimiter sau
                const $delimiter = $(`<p class="draggable seperate" data-group="${groupId}" style="margin: 0;">${barcodeStructure.seperatorChar}</p>`);
                $container.append($delimiter);
            } else {
                // delimiter trước
                const $delimiter = $(`<p class="draggable seperate" data-group="${groupId}" style="margin: 0;">${barcodeStructure.seperatorChar}</p>`);
                $container.append($delimiter);

                // field sau
                const $field = $(`<p class="h6 draggable text" data-group="${groupId}"  style="margin: 0; cursor: pointer;">${v.key}</p>`);
                $container.append($field);
            }
            groupId++;
        }
    })


}

function createWrapper(content = "New Field") {
    const $wrapper = $('<div class="p-wrapper"></div>');

    const $btnLeft = $('<button class="add-btn left">+</button>').on('click', function () {
        addBefore($(this));
    });

    const $p = $(`<p class="h6 draggable" style="margin: 0; cursor: pointer;">${content}<span style="color:red">*</span></p>`);

    const $btnRight = $('<button class="add-btn right">+</button>').on('click', function () {
        addAfter($(this));
    });

    $wrapper.append($btnLeft, $p, $btnRight);
    console.log($wrapper)
    return $wrapper;

}

// Thêm trước
$('.add-btn.left').click(function () {
    const $input = createInput();
    var delimiter = $("#delimiter").val();
    const $seperator = $(`<p data-comming="seperate" class="draggable seperate" data-group="${groupId}" style="margin: 0;">${delimiter}</p>`);
    $('.p-list').prepend($seperator);
    $('.p-list').prepend($input);
    $input.focus();
});

// Thêm sau
$('.add-btn.right').click(function () {
    const $input = createInput();
    var delimiter = $("#delimiter").val();
    const $seperator = $(`<p data-comming="seperate" data-group="${groupId}" class="draggable seperate" style="margin: 0;">${delimiter}</p>`);
    $('.p-list').append($seperator);
    $('.p-list').append($input);
    $input.focus();
});

// Tạo ô input để nhập
function createInput() {
    const $input = $('<input type="text" class="input-temp" placeholder="Nhập nội dung...">');
    // Khi nhấn Enter
    $input.on('keypress', function (e) {
        if (e.key === 'Enter') {
            finalizeInput($(this));
        }
    });

    // Khi mất focus
    $input.on('blur', function () {
        finalizeInput($(this));
    });

    return $input;
}

// Chuyển input thành thẻ <p>
function finalizeInput($input, seperator) {
    const text = $input.val().trim();
    if (text !== "") {
        const $p = $(`<p class="h6 draggable text" data-group="${groupId}" style="margin: 0;cursor: pointer">${text}</p>`);
        $input.replaceWith($p);
        $("p[data-comming='seperate']").attr("data-comming", "")
        groupId++;
    } else {
        $input.remove(); // nếu không nhập gì thì xóa luôn
        $("p[data-comming='seperate']").remove();
    }
}

$(document).on("dblclick", ".draggable", function () {
    if ($(this).hasClass("unDelete")) {
        return;
    }
    var getGroup = $(this).data("group");
    $(`p[data-group='${getGroup}']`).remove();
})

$("#submit").on("click", function () {
    var getCheck = $("#isSeperate").prop("checked");
    var getDelimiter = "";
    var getOldSeperate = $("#delimiter").val();
    if (getCheck) {
        var delimiter = $("#delimiter_new").val();
        if (delimiter == "") {
            toastr.error(resource.please_enter_delimiter);
            return;
        } else {
            var regex = /^[/\-\+\|.,@#$]+$/;
            if (!regex.test(delimiter.trim())) {
                toastr.error(resource.invalid_seperate_char);
                return
            }
        }
        getDelimiter = delimiter.trim();
    }
    var newPatternArray = [];
    var pList = $(".text");
    $.each(pList, function(i, v){
        var getStatus = $(v).hasClass("unDelete");
        var newObj = {
            key: $(v).text().replaceAll('*',''),
            status: getStatus
        };
        newPatternArray.push(newObj);
    })
    barcodeStructure.isSeparate = getCheck;
    barcodeStructure.seperatorChar = getDelimiter;
    barcodeStructure.structure = newPatternArray;

    $.ajax({
        url: "/WarehouseManagement/Warehouse/SaveBarcodeStructure",
        type: "POST",
        data: { model: JSON.stringify(barcodeStructure), "oldSeperate": getOldSeperate },
        success: function (response) {
            if (response.code === 200) {
                if (localStorage.getItem("layout_lable") != null) {
                    
                    var getElements = JSON.parse(localStorage.getItem("layout_lable"))
                    console.log(getElements)
                    getElements.Components.forEach(v => {
                        v.Fields = v.Fields.replace($("#delimiter").val().trim(), $("#delimiter_new").val().trim())
                    })
                    localStorage.setItem("layout_lable", JSON.stringify(getElements));
                }
                $(".label-element").each(function(){
                    var oldSeperate = $(this).attr("data-fields");
                    var replaceSeperate = oldSeperate.replace($("#delimiter").val().trim(), $("#delimiter_new").val().trim());
                    $(this).attr("data-fields", replaceSeperate);
                });
                toastr.success(response.msg);
                $("#delimiter").val($("#delimiter_new").val().trim());
                $(".seperate").text($("#delimiter").val());
                
                localStorage.setItem("barcodeStructure", JSON.stringify(barcodeStructure));
            } else {
                toastr.error(response.msg);
            }
        },
        error: function (xhr, status, err) {
            toastr.error(err);
            console.log(err);
        }
    })
})

$("#delimiter").on("change", function () {
    $(".seperate").text($(this).val());
})

//$("#selectType").on("change", function () {
//    var type = $(this).val();
//    ListPrinter(type);
//})
