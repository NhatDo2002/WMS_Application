"use strict";
// Class definition

var currentUrl = window.location.href;

var KTDropzoneDemo = function () {
	// Private functions
	var demo2 = function () {
		// set the dropzone container id
		var id = '#kt_dropzone_4';

		// set the preview element template
		var previewNode = $(id + " .dropzone-item");
		previewNode.id = "";
		var previewTemplate = previewNode.parent('.dropzone-items').html();
		previewNode.remove();

		var myDropzone4 = new Dropzone(id, { // Make the whole body a dropzone
			url: currentUrl, // Set the url for your upload script location
			parallelUploads: 20,
			previewTemplate: previewTemplate,
			maxFilesize: 2, // Max filesize in MB
			autoQueue: false, // Make sure the files aren't queued until manually added
			previewsContainer: id + " .dropzone-items", // Define the container to display the previews
			clickable: id + " .dropzone-select" // Define the element that should be used as click trigger to select files.
		});

		myDropzone4.on("addedfile", function (file) {
			// Hookup the start button
			console.log(file)
			let formdata = new FormData();
			formdata.append('file', file);
			$.ajax({
				type: 'post',
				url: '/WarehouseManagement/WareHouse/Upload',
				contentType: false,
				processData: false,
				data: formdata,
				success: function (data) {
					if (data.status == 200) {
						Swal.fire(data.msg);
						setTimeout(function () { window.location.href = "/WarehouseManagement/WareHouse/Index"; }, 1000);
					} else {
						Swal.fire(data.msg);
					}

				}
			})
			//file.previewElement.querySelector(id + " .dropzone-start").onclick = function () { myDropzone4.enqueueFile(file); };
			//$(document).find(id + ' .dropzone-item').css('display', '');
			//$(id + " .dropzone-upload, " + id + " .dropzone-remove-all").css('display', 'inline-block');
		});

		// Update the total progress bar
		//myDropzone4.on("totaluploadprogress", function (progress) {
		//	$(this).find(id + " .progress-bar").css('width', progress + "%");
		//});

		//myDropzone4.on("sending", function (file) {
		//	// Show the total progress bar when upload starts
		//	$(id + " .progress-bar").css('opacity', '1');
		//	// And disable the start button
		//	file.previewElement.querySelector(id + " .dropzone-start").setAttribute("disabled", "disabled");
		//});

		//// Hide the total progress bar when nothing's uploading anymore
		//myDropzone4.on("complete", function (progress) {
		//	var thisProgressBar = id + " .dz-complete";
		//	setTimeout(function () {
		//		$(thisProgressBar + " .progress-bar, " + thisProgressBar + " .progress, " + thisProgressBar + " .dropzone-start").css('opacity', '0');
		//	}, 300)

		//});

		//// Setup the buttons for all transfers
		//document.querySelector(id + " .dropzone-upload").onclick = function () {
		//	myDropzone4.enqueueFiles(myDropzone4.getFilesWithStatus(Dropzone.ADDED));
		//};

		//// Setup the button for remove all files
		//document.querySelector(id + " .dropzone-remove-all").onclick = function () {
		//	$(id + " .dropzone-upload, " + id + " .dropzone-remove-all").css('display', 'none');
		//	myDropzone4.removeAllFiles(true);
		//};

		//// On all files completed upload
		//myDropzone4.on("queuecomplete", function (progress) {
		//	$(id + " .dropzone-upload").css('display', 'none');
		//});

		//// On all files removed
		//myDropzone4.on("removedfile", function (file) {
		//	if (myDropzone4.files.length < 1) {
		//		$(id + " .dropzone-upload, " + id + " .dropzone-remove-all").css('display', 'none');
		//	}
		//});
	}

	return {
		// public functions
		init: function () {
			demo2();
		}
	};
}();

$(document).on('change', '#csvInput', function (e) {
	const file = this.files[0];
	if (file) {
		var formData = new FormData();
		formData.append("file", file);
		SendFileUpload(formData);
	}
})

function SendFileUpload(formData) {
	$.ajax({
		type: 'post',
		url: '/WarehouseManagement/WareHouse/Upload',
		contentType: false,
		processData: false,
		data: formData,
		success: function (data) {
			if (data.status == 200) {
				Swal.fire(data.msg);
				setTimeout(function () { window.location.href = "/WarehouseManagement/WareHouse/Index"; }, 1000);
			} else {
				Swal.fire(data.msg);
			}

		}
	})

	$('#csvInput').val("")
}

var KTDatatableColumnRenderingDemo = function () {
	// Private functions

	// basic demo
	var demo = function () {

		var datatable = $('#warehouse_datatable').KTDatatable({
			// datasource definition
			data: {
				type: 'remote',
				source: {
					read: {
						url: '/WarehouseManagement/WareHouse/List',
					},
				},
				pageSize: 10, // display 20 records per page
				serverPaging: true,
				serverFiltering: true,
				serverSorting: true,
				saveState: false,
			},

			// layout definition
			layout: {
				scroll: false, // enable/disable datatable scroll both horizontal and vertical when needed.
				footer: false, // display/hide footer
			},

			translate: {
				records: {
					processing: resourceLayout.processing,
					noRecords: resourceLayout.no_data,
				},
				toolbar: {
					pagination: {
						items: {
							info: `${resourceLayout.showing} {{start}} - {{end}} ${resourceLayout.of} {{total}} ${resourceLayout.entries}`
						}
					}
				}
			},

			// column sorting
			sortable: true,

			pagination: true,

			search: {
				input: $('#kt_datatable_search_query'),
				delay: 400,
				key: 'generalSearch'
			},

			// columns definition
			columns: [
				{
					field: 'STT',
					title: '#',
					sortable: 'asc',
					width: 70,
					type: 'number',
					selector: false,
					textAlign: 'center',
					template: function (data) {
						return '<span class="font-weight-bolder">' + data.STT + '</span>';
					}
				}, {
					field: 'Name',
					title: resources.wh_name,
					sortable: 'asc',
					textAlign: "left",
					width: 150,
					template: function (data) {
						var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + data.Name + '</div>';
						return output;
					},
				},
				{
					field: 'Description',
					title: resources.description,
					sortable: 'asc',
					textAlign: "left",
					width: 150,
					template: function (data) {
						var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;">' + (data.Description !== null ? data.Description : "") + '</div>';
						return output;
					},
				}, {
					field: 'MinInventory',
					title: resources.min,
					width: 230,
					textAlign: "center",
					template: function (row) {
						var output = '';
						output += '<div class="font-weight-bolder mb-0">' + row.MinInventory + '</div>';

						return output;
					},
				}, {
					field: 'MaxInventory',
					title: resources.max,
					textAlign: "center",
					width: 230,
					template: function (data) {
						var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0">' + data.MaxInventory + '</div>';
						return output;
					},
				}
				, {
					field: 'CreateDate',
					title: resources.createDate,
					type: 'date',
					format: 'MM/DD/YYYY',
					template: function (row) {
						var output = '';
						output += '<div class="font-weight-bolder text-primary mb-0">' + row.CreateDate + '</div>';

						return output;
					},
				}, {
					field: 'CreateBy',
					title: resources.createBy,
					template: function (data) {
						var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;>' + data.CreateBy + '</div>';
						return output;
					},
				}, {
					field: 'ModifyDate',
					title: resources.modifyDate,
					type: 'date',
					format: 'MM/DD/YYYY',
					template: function (row) {
						var output = '';
						output += '<div class="font-weight-bolder text-primary mb-0">' + row.ModifyDate + '</div>';

						return output;
					},
				}, {
					field: 'ModifyBy',
					title: resources.modifyBy,
					template: function (data) {
						var output = '<div class="text-dark-75 font-weight-bolder font-size-lg mb-0" style="white-space: normal; word-wrap: break-word;>' + data.ModifyBy + '</div>';
						return output;
					},
				}
				, {
					field: 'Status',
					title: resources.status,
					// callback function support for column rendering
					template: function (data) {
						console.log(data.Status)
						var status = {
							true: { 'title': resources.work, 'class': 'label-light-success' },
							false: { 'title': resources.nowork, 'class': 'label-light-danger' },
							null: { 'title': resources.work, 'class': 'label-light-success' }
						};
						return '<span class="label font-weight-bold label-lg ' + status[data.Status].class + ' label-inline">' + status[data.Status].title + '</span>';
					},
				}, {
					field: 'Actions',
					title: resources.action,
					sortable: false,
					width: 125,
					overflow: 'visible',
					autoHide: false,
					template: function (data) {
						return '\
	                        <a href="/WarehouseManagement/WareHouse/Edits/'+ data.Id + '" class="btn btn-sm btn-clean btn-icon mr-2" title="' + resources.edit + '">\
	                            <span class="svg-icon svg-icon-md">\
	                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">\
	                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\
	                                        <rect x="0" y="0" width="24" height="24"/>\
	                                        <path d="M8,17.9148182 L8,5.96685884 C8,5.56391781 8.16211443,5.17792052 8.44982609,4.89581508 L10.965708,2.42895648 C11.5426798,1.86322723 12.4640974,1.85620921 13.0496196,2.41308426 L15.5337377,4.77566479 C15.8314604,5.0588212 16,5.45170806 16,5.86258077 L16,17.9148182 C16,18.7432453 15.3284271,19.4148182 14.5,19.4148182 L9.5,19.4148182 C8.67157288,19.4148182 8,18.7432453 8,17.9148182 Z" fill="#000000" fill-rule="nonzero"\ transform="translate(12.000000, 10.707409) rotate(-135.000000) translate(-12.000000, -10.707409) "/>\
	                                        <rect fill="#000000" opacity="0.3" x="5" y="20" width="15" height="2" rx="1"/>\
	                                    </g>\
	                                </svg>\
	                            </span>\
	                        </a>\
	                        <a name="deleteWarehouse" id="delete' + data.Id + '" class="btn btn-sm btn-clean btn-icon" title="' + resources.delete + '">\
	                            <span class="svg-icon svg-icon-md">\
	                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">\
	                                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\
	                                        <rect x="0" y="0" width="24" height="24"/>\
	                                        <path d="M6,8 L6,20.5 C6,21.3284271 6.67157288,22 7.5,22 L16.5,22 C17.3284271,22 18,21.3284271 18,20.5 L18,8 L6,8 Z" fill="#000000" fill-rule="nonzero"/>\
	                                        <path d="M14,4.5 L14,4 C14,3.44771525 13.5522847,3 13,3 L11,3 C10.4477153,3 10,3.44771525 10,4 L10,4.5 L5.5,4.5 C5.22385763,4.5 5,4.72385763 5,5 L5,5.5 C5,5.77614237 5.22385763,6 5.5,6 L18.5,6 C18.7761424,6 19,5.77614237 19,5.5 L19,5 C19,4.72385763 18.7761424,4.5 18.5,4.5 L14,4.5 Z" fill="#000000" opacity="0.3"/>\
	                                    </g>\
	                                </svg>\
	                            </span>\
	                        </a>\
	                    ';
					},
				}],

		});

		$('#kt_datatable_search_status').on('change', function () {
			datatable.search($(this).val().toLowerCase(), 'Status');
		});

		$('#kt_datatable_search_type').on('change', function () {
			datatable.search($(this).val().toLowerCase(), 'Type');
		});

		$(document).on('click', 'a[name="deleteWarehouse"]', function () {
			var id = $(this).attr('id').substring(6);
			Swal.fire({
				title: resources.DeleteWarning,
				html: resources.DeleteInfo,
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#3085d6",
				cancelButtonColor: "#d33",
				cancelButtonText: resources.CancelInfo,
				confirmButtonText: resources.ConfirmDeleteWarning
			}).then((result) => {
				if (result.isConfirmed) {
					$.ajax({
						type: "POST",
						url: "/WarehouseManagement/Warehouse/Delete",
						data: { id },
						success: function (result) {
							if (result.code == 200) {
								toastr.success(resources.DeleteSuccess);
								datatable.reload();
							} else {
								toastr.error(result.msg)
							}
						},
						error: function () {
							toastr.error('Đã có lỗi xảy ra, vui lòng thử lại!')
						}
					})
				}
			});
		});

		$('#kt_datatable_search_status, #kt_datatable_search_type').selectpicker();

	};

	return {
		// public functions
		init: function () {
			demo();
		},
	};
}();

jQuery(document).ready(function () {
	KTDatatableColumnRenderingDemo.init();
	//KTDropzoneDemo.init();
});

function ExportPDF() {
	$.ajax({
		url: "/WarehouseManagement/WareHouse/ExportPDF",
		type: "GET",
		success: function (response) {
			if (response.code === 200) {
				const byteCharacters = atob(response.fileContent);
				const byteNumbers = new Array(byteCharacters.length);

				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}

				const byteArray = new Uint8Array(byteNumbers);

				// Tạo Blob từ dữ liệu nhị phân
				const blob = new Blob([byteArray], { type: 'application/pdf' });

				// Tạo link để tải xuống mà không cần append vào DOM
				const link = document.createElement("a");
				const url = window.URL.createObjectURL(blob);
				link.href = url;
				link.download = response.fileName; // Đặt tên tệp khi tải xuống
				link.click();

				// Giải phóng URL để tránh lãng phí bộ nhớ
				window.URL.revokeObjectURL(url);

				toastr.success(response.msg);
			} else {
				toastr.error(resources.ErrorCall);
			}
		},
		error: function (xhr, status, error) {
			console.error(error)
		}
	});
}

function ExportCSV() {
	$.ajax({
		url: "/WarehouseManagement/WareHouse/ExportCSV",
		type: "GET",
		success: function (response) {
			if (response.code === 200) {
				const byteCharacters = atob(response.fileContent);
				const byteNumbers = new Array(byteCharacters.length);

				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}

				const byteArray = new Uint8Array(byteNumbers);

				// Tạo Blob từ dữ liệu nhị phân
				const blob = new Blob([byteArray], { type: 'text/csv' });

				// Tạo link để tải xuống mà không cần append vào DOM
				const link = document.createElement("a");
				const url = window.URL.createObjectURL(blob);
				link.href = url;
				link.download = response.fileName; // Đặt tên tệp khi tải xuống
				link.click();

				// Giải phóng URL để tránh lãng phí bộ nhớ
				window.URL.revokeObjectURL(url);

				toastr.success(response.msg);
			} else {
				toastr.error(resources.ErrorCall);
			}
		},
		error: function (xhr, status, error) {
			console.error(error)
		}
	});
}

function ExportExcel() {
	$.ajax({
		url: "/WarehouseManagement/WareHouse/ExportExcel",
		type: "GET",
		success: function (response) {
			if (response.code === 200) {
				const byteCharacters = atob(response.fileContent);
				const byteNumbers = new Array(byteCharacters.length);

				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}

				const byteArray = new Uint8Array(byteNumbers);

				// Tạo Blob từ dữ liệu nhị phân
				const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

				// Tạo link để tải xuống mà không cần append vào DOM
				const link = document.createElement("a");
				const url = window.URL.createObjectURL(blob);
				link.href = url;
				link.download = response.fileName; // Đặt tên tệp khi tải xuống
				link.click();

				// Giải phóng URL để tránh lãng phí bộ nhớ
				window.URL.revokeObjectURL(url);

				toastr.success(response.msg);
			} else {
				toastr.error(resources.ErrorCall);
			}
		},
		error: function (xhr, status, error) {
			console.error(error)
		}
	});
}

$("#printBtn").on("click", function () {
	initHeader()
	printData()
})

function initHeader() {
	var string = "drag-container-1"
	var listInfo = $(`#${string} [data-header]`);
	$.each(listInfo, (i, v) => {
		$(v).text(dataBill["header" + (i + 1)]);
	})
}

function printData() {
	$.ajax({
		url: "/WarehouseManagement/WareHouse/GetPrintData",
		type: "POST",
		success: function (response) {
			if (response.code === 200) {
				$("#tbodyPrint").empty()
				$("#countTotal").text("")
				$("#userPrint").text("")
				$("#timePrint").text("")
				response.list.forEach(g => {
					var string = `
						<tr>
                                <td style="padding: 12px; border: 1px solid #ddd;">${g.Name}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${g.Description !== null ? g.Description : ""}</td>
								<td style="padding: 12px; border: 1px solid #ddd;">${g.MinInventory}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${g.MaxInventory}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${convertJsonDate(g.CreateDate)}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${g.CreateBy}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${convertJsonDate(g.ModifyDate)}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${g.ModifyBy}</td>
                            </tr>
					`;
					$("#tbodyPrint").append(string);
				})
				$("#countTotal").text(response.list.length);
				$("#userPrint").text(response.name);
				$("#timePrint").text((response.date));

				$("#printModal").modal("show");
			} else {
				toastr.error(response.msg)
			}
		},
		error: function (xhr, status, err) {
			toastr.error(err)
		}
	})
}

function convertJsonDate(jsonDate) {
	// Trích xuất timestamp từ chuỗi JSON Date
	var timestamp = jsonDate.match(/\/Date\((\d+)\)\//);
	if (timestamp) {
		// Chuyển timestamp thành đối tượng Date
		var date = new Date(parseInt(timestamp[1]));

		// Định dạng ngày tháng theo dd-MM-yyyy
		var day = ("0" + date.getDate()).slice(-2);
		var month = ("0" + (date.getMonth() + 1)).slice(-2); // Tháng bắt đầu từ 0
		var year = date.getFullYear();

		// Trả về ngày theo định dạng dd-MM-yyyy
		return day + "-" + month + "-" + year;
	}
	return null;
}

function openAndPrint() {
	// Lấy nội dung từ modal
	const modalContent = $("#printModal").find("#printArea").html();

	// Mở cửa sổ mới
	const newWindow = window.open('', '_blank', 'width=800,height=600');

	// Tạo nội dung HTML cho cửa sổ mới
	const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>In Nội Dung</title>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 20px;
                }
                .modal-body {
                    text-align: left;
                }
                .printContainer {
                    overflow: visible !important;
                    max-height: fit-content !important;
                    width: 100%;
                    margin-bottom: 20px;
                }
                .modal-header {
                    text-align: center;
                    border-bottom: 2px solid #007bff;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                }
                .modal-header h1 {
                    font-size: 26px;
                    font-weight: bold;
                    color: #007bff;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table th, table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                table th {
                    background-color: #f2f2f2;;
                    color: black;
                }
                @media print {
                    body {
                        margin: 10px;
                    }
                    @page {
                        margin: 0; /* Xóa margin mặc định của trình duyệt */
                    }
                }
            </style>
        </head>
        <body>
            ${modalContent}
        </body>
        </html>
    `;

	// Ghi nội dung vào tài liệu của cửa sổ mới
	newWindow.document.open();
	newWindow.document.write(htmlContent);
	newWindow.document.close();

	// In nội dung và đóng cửa sổ sau khi in xong
	newWindow.print();
}

$(document).on("dblclick", ".edit-text", function () {
	const $this = $(this);
	var content = $(this).text();
	// Kích hoạt chỉnh sửa
	$this.attr('contenteditable', 'true').focus();

	// Tắt chỉnh sửa khi mất focus hoặc nhấn Enter
	$this.on('blur keydown', function (event) {
		if (event.type === 'blur' || event.key === 'Enter') {
			var newContent = $($this).text();
			if (content !== newContent) {
				$("#updateBtn").css("display", "block");
			}
			event.preventDefault(); // Ngăn Enter thêm dòng
			$this.removeAttr('contenteditable');
			$this.off('blur keydown'); // Xóa sự kiện để tránh lặp lại
		}
	});
})

document.addEventListener("DOMContentLoaded", function () {
	// Chọn các container cần hỗ trợ kéo thả
	const containers = [
		document.getElementById('drag-container-1'),
		document.getElementById('drag-container-2'),
	];

	// Khởi tạo Dragula
	dragula(containers, {
		accepts: function (el, target) {
			// Luôn cho phép thả vào bất kỳ container nào
			return true;
		},
		/*removeOnSpill: true*/
	})
		.on('drag', function (el) {
			/*console.log('Bắt đầu kéo:', el.textContent.trim());*/
		})
		.on('drop', function (el, target, source) {
			//console.log('Đã thả:', el.textContent.trim());
			//console.log('Từ:', source.id, 'Đến:', target.id);
			$("#updateBtn").css("display", "block");
		})
		.on('cancel', function (el) {
			/*console.log('Kéo bị hủy:', el.textContent.trim());*/
		})
	//.on('remove', function (el) {
	//	$("#updateBtn").css("display", "block");
	//});
});


$("#updateBtn").on("click", function () {
	updateHeader()
})

function updateHeader() {
	$("#wait").attr("hidden", false);
	var dataUpdate = {};
	var string = "drag-container-1"
	var listInfo = $(`#${string} [data-header]`);
	$.each(listInfo, (i, v) => {
		var key = `header${i + 1}`;
		dataUpdate[key] = $(v).text();
	})
	//for (var i = 1; i <= 5; i++) {
	//	var string = "drag-container-" + i;
	//	var listInfo = $(`#${string} [data-header]`);
	//	var obj = {}
	//	$.each(listInfo, (i, v) => {
	//		var key = `obj${i + 1}`;
	//		obj[key] = $(v).text();
	//	})
	//	dataUpdate.push(obj);
	//}
	var passData = JSON.stringify(dataUpdate);
	$.ajax({
		url: "/MasterData/Goods/UpdateHeaderBill",
		type: "POST",
		data: { data: passData },
		success: function (response) {
			if (response.code === 200) {
				toastr.success(response.msg);
				$("#updateBtn").css("display", "none");
			} else {
				toastr.error(response.msg);
			}
		},
		error: function (xhr, status, err) {
			toastr.error(err);
		}
	})
}