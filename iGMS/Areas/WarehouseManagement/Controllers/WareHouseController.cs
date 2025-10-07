using iText.IO.Font;
using iText.Kernel.Colors;
using iText.Kernel.Font;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Draw;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using Microsoft.IdentityModel.Tokens;
using Microsoft.SqlServer.Management.XEvent;
using Newtonsoft.Json;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Net;
using System.Resources;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Services.Description;
using System.Web.UI.WebControls;
using WMS.Models;
using WMS.Controllers;
using static WMS.Models.DataList;
using static WMS.Models.DataForm;
using static WMS.Areas.WarehouseManagement.Controllers.PrintingController;
using Google.Apis.Drive.v3.Data;

namespace WMS.Areas.WarehouseManagement.Controllers
{
    public class WareHouseController : BaseController
    {
        private WMSEntities db = new WMSEntities();
        private AuthorizationController author = new AuthorizationController();
        private ResourceManager rm = new ResourceManager("WMS.App_GlobalResources.Resource", typeof(Resources.Resource).Assembly);

        //private IHubContext<RealHub> hub;
        // GET: WareHouse
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult ShowList()
        {
            var warehouse = db.WareHouses.ToList();

            // Gán giá trị vào ViewBag để sử dụng trong view
            ViewBag.WareHouses = warehouse;
            return View();
        }

        public ActionResult AssetShowList()
        {
            return View();
        }

        public ActionResult Adds()
        {
            var lastId = db.WareHouses.OrderBy(x => x.Id).ToList().LastOrDefault();
            var idNext = "";
            if (lastId != null)
            {
                idNext = IdNext(lastId.Id);
            }
            ViewBag.idNext = idNext;
            return View();
        }

        public ActionResult Edits(string id)
        {
            if (id.Length == 0)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            WareHouse wareHouse = db.WareHouses.Find(id);
            if (wareHouse == null)
            {
                return HttpNotFound();
            }
            return View(wareHouse);
        }

        [HttpGet]
        public JsonResult WarehouseStatistics()
        {
            try
            {
                //var data = db.DetailWareHouses
                //        .GroupBy(x => x.IdWareHouse)
                //        .Select(p => new
                //        {
                //            id = p.Key,
                //            total = p.Sum(x => x.Inventory)
                //        })
                //        .Join(
                //            db.WareHouses,        // Table to join
                //            dw => dw.id,          // Key from grouped result
                //            w => w.Id,            // Key from Warehouses table
                //            (dw, w) => new        // Result selector
                //            {
                //                id = dw.id,
                //                total = dw.total,
                //                name = w.Name      // Select the Name from Warehouses
                //            }
                //        )
                //        .OrderBy(x => x.id)
                //        .ToList();

                var data = (from dw in db.DetailWareHouses
                            group dw by dw.IdWareHouse into g
                            join w in db.WareHouses on g.Key equals w.Id
                            orderby g.Key
                            select new
                            {
                                id = g.Key,
                                total = g.Sum(x => x.Inventory),
                                name = w.Name
                            }).ToList();


                var names = data.Select(x => x.name).ToList();
                var totals = data.Select(x => x.total).ToList();

                return Json(new { code = 200, names = names, totals = totals }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult List(PaginationParams pagination, SortParams sort, QueryParams query)
        {
            try
            {
                var search = query?.GeneralSearch == null ? "" : query.GeneralSearch;
                var querys = db.WareHouses.AsQueryable();
                if (sort.Field != "STT")
                {
                    querys = db.WareHouses.OrderBy($"{sort.Field} ASC");
                    if (sort.Sort == "desc")
                    {
                        querys = db.WareHouses.OrderBy($"{sort.Field} DESC");
                    }
                }

                var filtered = querys.ToList().Where(x => x.Name.Contains(search.Trim()) || (x.Description != null && x.Description.Contains(search.Trim()))).ToList();

                var result = filtered
                            .Select((u, index) => new
                            {
                                Warehouse = u,
                                STT = index + 1
                            })
                            .ToList();

                if (sort.Field == "STT")
                {
                    result = (sort.Sort == "desc")
                        ? result.OrderByDescending(x => x.STT).ToList()
                        : result.OrderBy(x => x.STT).ToList();
                }

                var datas = result.Select((u, index) => new
                            {
                                STT = u.STT,
                                u.Warehouse.Id,
                                u.Warehouse.Description,
                                u.Warehouse.Name,
                                u.Warehouse.MaxInventory,
                                u.Warehouse.MinInventory,
                                CreateDate = u.Warehouse.CreateDate?.ToString("dd/MM/yyyy") ?? string.Empty,
                                ModifyDate = u.Warehouse.ModifyDate?.ToString("dd/MM/yyyy") ?? string.Empty,
                                u.Warehouse.CreateBy,
                                u.Warehouse.ModifyBy,
                                Status = u.Warehouse.Status
                            })
                            .ToList();
                var data = datas.Skip((pagination.Page - 1) * pagination.PerPage).Take(pagination.PerPage).ToList();
                var pages = (int)Math.Ceiling((double)datas.Count() / pagination.PerPage);
                var total = datas.Count();
                var meta = new
                {
                    page = pagination.Page,
                    pages = pages,
                    perpage = pagination.PerPage,
                    total = total,
                    sort = sort.Sort,
                    field = sort.Field
                };
                return Json(new { code = 200, data, meta });
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message });
            }
        }

        [HttpPost]
        public JsonResult Add(string name, int min, int max, string des)
        {
            try
            {
                var session = (Models.User)Session["user"];
                var nameAdmin = session.User1;
                var date = DateTime.Now;
                byte[] bytes = System.Text.Encoding.UTF8.GetBytes(name);
                string base64String = Convert.ToBase64String(bytes);
                var id = base64String + date.Year + date.Month + date.Day + date.Hour + date.Minute + date.Second + date.Millisecond;
                var ids = db.WareHouses.Where(x => x.Id == id).ToList();
                var checkName = db.WareHouses.FirstOrDefault(x => x.Name.ToLower() == name.ToLower());
                if(min >= max)
                {
                    return Json(new { code = 500, msg = rm.GetString("min_more_than_max") }, JsonRequestBehavior.AllowGet);
                }
                if (checkName != null)
                {
                    return Json(new { code = 500, msg = rm.GetString("DuplicateName") }, JsonRequestBehavior.AllowGet);
                }
                if (ids.Count == 0)
                {
                    var d = new WareHouse();
                    d.Id = id.Replace("=", "");
                    d.Name = name;
                    d.MinInventory = min;
                    d.MaxInventory = max;
                    d.Description = des;
                    d.CreateDate = DateTime.Now;
                    d.CreateBy = session.Name;
                    d.ModifyDate = DateTime.Now;
                    d.ModifyBy = session.Name;
                    db.WareHouses.Add(d);
                    var listGoods = db.Goods.ToList();
                    if (listGoods.Any())
                    {
                        foreach (var item in listGoods)
                        {
                            var newDetail = new DetailWareHouse
                            {
                                IdWareHouse = d.Id,
                                IdGoods = item.Id,
                                Inventory = 0,
                                Status = true
                            };
                            db.DetailWareHouses.Add(newDetail);
                        }
                    }
                    db.SaveChanges();
                    return Json(new { code = 200, msg = rm.GetString("CreateSucess") }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { code = 300, msg = rm.GetString("Duplicate") }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult Upload(HttpPostedFileBase file)
        {
            List<string> logError = new List<string>();
            try
            {
                var session = (Models.User)Session["user"];
                var nameAdmin = session.Name;

                if (file != null)
                {
                    if (file.ContentLength == 0)
                    {
                        return Json(new { status = 500, msg = rm.GetString("choose_file_error") }, JsonRequestBehavior.AllowGet);
                    }
                    if ((file != null) && (file.ContentLength > 0) && !string.IsNullOrEmpty(file.FileName))
                    {
                        //Dictionary<string, int> detailRow = new 
                        string fileName = file.FileName;
                        string fileContentType = file.ContentType;
                        byte[] fileBytes = new byte[file.ContentLength];
                        var data = file.InputStream.Read(fileBytes, 0, Convert.ToInt32(file.ContentLength));
                        using (var package = new ExcelPackage(file.InputStream))
                        {
                            List<WareHouse> warehouseList = new List<WareHouse>();
                            foreach (var worksheet in package.Workbook.Worksheets)
                            {
                                ExcelWorksheet currentSheet = worksheet;
                                var workSheet = currentSheet;
                                var noOfCol = workSheet.Dimension.End.Column;
                                var noOfRow = workSheet.Dimension.End.Row;
                                
                                if(!workSheet.Cells[1, 1].Value.Equals(rm.GetString("warehouse_name")) || !workSheet.Cells[1, 2].Value.Equals(rm.GetString("description")) || !workSheet.Cells[1, 3].Value.Equals(rm.GetString("warehouse_min")) || !workSheet.Cells[1, 4].Value.Equals(rm.GetString("warehouse_max")))
                                {
                                    return Json(new { status = 500, msg = rm.GetString("excel_not_correct_format") });
                                }

                                for (int rowIterator = 2; rowIterator <= noOfRow; rowIterator++)
                                {
                                    var NameWareHouse = workSheet.Cells[rowIterator, 1].Value == null ? "" : workSheet.Cells[rowIterator, 1].Value.ToString();
                                    var Des = workSheet.Cells[rowIterator, 2].Value == null ? "" : workSheet.Cells[rowIterator, 2].Value.ToString();
                                    var Min = workSheet.Cells[rowIterator, 3].Value == null ? "" : workSheet.Cells[rowIterator, 3].Value.ToString();
                                    var Max = workSheet.Cells[rowIterator, 4].Value == null ? "" : workSheet.Cells[rowIterator, 4].Value.ToString();

                                    bool isValidMin = int.TryParse(Min, out int resultMin);
                                    bool isValidMax = int.TryParse(Max, out int resultMax);

                                    var date = DateTime.Now;
                                    byte[] bytes = System.Text.Encoding.UTF8.GetBytes(NameWareHouse);
                                    string base64String = Convert.ToBase64String(bytes);
                                    var id = base64String + date.Year + date.Month + date.Day + date.Hour + date.Minute + date.Second + date.Millisecond;
                                    var ids = db.WareHouses.Where(x => x.Id == id).ToList();
                                    var checkNameExcel = warehouseList.FirstOrDefault(x => x.Name.ToLower() == NameWareHouse.ToLower());
                                    var checkNameWareHouse = db.WareHouses.FirstOrDefault(x => x.Name.ToLower() == NameWareHouse.ToLower());
                                    if (!isValidMin)
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("minimum_stock_at_row")} {rowIterator} {rm.GetString("not_valid_number")} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (!isValidMax)
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("maximum_stock_at_row")} {rowIterator} {rm.GetString("not_valid_number")} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (checkNameWareHouse != null)
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("warehouse_line")} {rowIterator} {rm.GetString("added_in_system")} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (string.IsNullOrEmpty(NameWareHouse))
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("warehouse_line")} {rowIterator} {rm.GetString("is_not_empty")} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (checkNameExcel != null)
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("warehouse_line")}  {rowIterator} {rm.GetString("duplicated_line")} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (int.Parse(Min) >= int.Parse(Max))
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("warehouse_min_upload")} {rowIterator} {rm.GetString("warehouse_min_max_upload")} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (int.Parse(Max) < int.Parse(Min))
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("warehouse_max_upload")} {rowIterator} {rm.GetString("warehouse_max_min_upload")} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (ids.Count == 0)
                                    {
                                        var d = new WareHouse()
                                        {
                                            Id = id.Replace("=", ""),
                                            Name = NameWareHouse,
                                            MinInventory = int.Parse(Min),
                                            MaxInventory = int.Parse(Max),
                                            Description = Des,
                                            CreateBy = session.Name,
                                            CreateDate = DateTime.Now,
                                            ModifyBy = session.Name,
                                            ModifyDate = DateTime.Now
                                        };
                                        warehouseList.Add(d);
                                    }
                                    else
                                    {
                                        return Json(new { status = 500, msg = rm.GetString("warehouse_duplicated_upload") }, JsonRequestBehavior.AllowGet);
                                    }
                                }
                            }
                            var listGoods = db.Goods.ToList();
                            foreach (var wh in warehouseList)
                            {
                                if (listGoods.Any())
                                {
                                    foreach (var item in listGoods)
                                    {
                                        var newDetail = new DetailWareHouse
                                        {
                                            IdWareHouse = wh.Id,
                                            IdGoods = item.Id,
                                            Inventory = 0,
                                            Status = true
                                        };
                                        db.DetailWareHouses.Add(newDetail);
                                    }
                                }
                            }
                            db.WareHouses.AddRange(warehouseList);
                            db.SaveChanges();
                        }
                    }
                }
                return Json(new { status = 200, logError, msg = rm.GetString("CreateSucess") }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = 500, logError, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public JsonResult Edit(string id, string name, int min, int max, string des)
        {
            try
            {
                var session = (Models.User)Session["user"];
                var nameAdmin = session.User1;
                var d = db.WareHouses.Find(id);
                var checkName = db.WareHouses.FirstOrDefault(x => x.Id != id && x.Name.ToLower() == name.ToLower());
                if (checkName != null)
                {
                    return Json(new { code = 500, msg = rm.GetString("DuplicateName") }, JsonRequestBehavior.AllowGet);
                }
                if (min >= max)
                {
                    return Json(new { code = 500, msg = rm.GetString("min_more_than_max") }, JsonRequestBehavior.AllowGet);
                }
                d.Id = id;
                d.Name = name;
                d.MinInventory = min;
                d.MaxInventory = max;
                d.Description = des;
                d.ModifyBy = session.Name;
                d.ModifyDate = DateTime.Now;
                db.SaveChanges();
                return Json(new { code = 200, msg = rm.GetString("SucessEdit").ToString() }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult WareHouseSearch(string name)
        {
            try
            {
                if (!string.IsNullOrEmpty(name))
                {
                    var c = (from b in db.WareHouses
                             where b.Name.Contains(name)
                             select new
                             {
                                 idwarehouse = b.Id,
                                 nameWarehouse = b.Name,
                             }).ToList();

                    return Json(new { code = 200, c }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("error") }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DetailWareHouse(string id)
        {
            try
            {
                if (!string.IsNullOrEmpty(id))
                {
                    var c = (from b in db.WareHouses
                             where b.Id == id
                             select new
                             {
                                 idwarehouse = b.Id,
                                 nameWarehouse = b.Name,
                             }).ToList();
                    return Json(new { code = 200, c }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("error") }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult Delete(string id)
        {
            var session = (Models.User)Session["user"];
            using (var transaction = db.Database.BeginTransaction())
            {
                try
                {
                    var d = db.WareHouses.Find(id);
                    var de = db.DetailWareHouses.Where(x => x.IdWareHouse == id).ToList();
                    var checkDe = de.Any(x => x.Inventory > 0);
                    if (checkDe)
                    {
                        return Json(new { code = 500, msg = rm.GetString("wh_already_contains_goods") }, JsonRequestBehavior.AllowGet);
                    }
                    var ddeliveries = db.Deliveries.Where(x => x.IdWareHouse == id).ToList();
                    foreach (var delivery in ddeliveries)
                    {
                        var listDetail = db.DetailDeliveries.Where(x => x.IdDelivery == delivery.Id).ToList();
                        db.DetailDeliveries.RemoveRange(listDetail);
                    }
                    db.Deliveries.RemoveRange(ddeliveries);
                    var dsaleorders = db.SalesOrders.Where(x => x.IdWareHouse == id).ToList();
                    foreach (var saleorder in dsaleorders)
                    {
                        var listDetail = db.DetailSaleOrders.Where(x => x.IdSaleOrder == saleorder.Id).ToList();
                        db.DetailSaleOrders.RemoveRange(listDetail);
                    }
                    db.SalesOrders.RemoveRange(dsaleorders);

                    var dpos = db.PurchaseOrders.Where(x => x.IdWareHouse == id).ToList();
                    foreach (var po in dpos)
                    {
                        var listDetail = db.DetailGoodOrders.Where(x => x.IdPurchaseOrder == po.Id).ToList();
                        db.DetailGoodOrders.RemoveRange(listDetail);

                        var listReceipts = db.Receipts.Where(x => x.IdPurchaseOrder == po.Id).ToList();
                        foreach(var receipt in listReceipts)
                        {
                            var listDetailRe = db.DetailReceipts.Where(x => x.IdReceipt == receipt.Id).ToList();
                            db.DetailReceipts.RemoveRange(listDetailRe);
                        }

                        db.Receipts.RemoveRange(listReceipts);
                    }
                    db.PurchaseOrders.RemoveRange(dpos);

                    db.DetailWareHouses.RemoveRange(de);
                    db.WareHouses.Remove(d);
                    db.SaveChanges();
                    transaction.Commit();
                    return Json(new { code = 200, msg = rm.GetString("SucessDelete") }, JsonRequestBehavior.AllowGet);
                }
                catch (Exception)
                {
                    transaction.Rollback();
                    return Json(new { code = 500, msg = rm.GetString("FailDelete") }, JsonRequestBehavior.AllowGet);
                }
            }
                
        }

        public string IdNext(string id)
        {
            char lastChar = id[id.Length - 1];

            var position = GetAlphabetPosition(lastChar);
            string newId = "";
            if (position == -1)
            {
                var numNext = int.Parse(lastChar.ToString()) + 1;
                if (numNext - 1 == 9)
                {
                    newId = id.Substring(0, id.Length) + "0";
                }
                else
                {
                    newId = id.Substring(0, id.Length - 1) + numNext.ToString();
                }
                return newId;
            }
            else
            {
                char character = (char)('A' + position);

                if (id.Length > 0)
                {
                    if (character.ToString() == "[")
                    {
                        newId = id.Substring(0, id.Length) + "A";
                    }
                    else
                    {
                        newId = id.Substring(0, id.Length - 1) + character.ToString();
                    }
                }
                return newId;
            }
        }

        private static int GetAlphabetPosition(char character)
        {
            // Chuyển đổi ký tự thành chữ cái in hoa để đảm bảo tính nhất quán
            char upperCaseChar = char.ToUpper(character);

            // Kiểm tra xem ký tự có thuộc bảng chữ cái tiếng Anh không
            if (upperCaseChar < 'A' || upperCaseChar > 'Z')
            {
                return -1; // Ký tự không thuộc bảng chữ cái tiếng Anh
            }

            // Tính vị trí của ký tự trong bảng chữ cái
            int position = upperCaseChar - 'A' + 1;

            return position;
        }

        [HttpPost]
        public JsonResult GetDetailListWH()
        {
            try
            {
                var count = 1;
                var data = db.DetailWareHouses
                .Where(x => !x.IdGoods.Contains("J"))
                .GroupBy(b => new { b.IdWareHouse, b.WareHouse.Name })
                .AsEnumerable()
                .Select((g, i) => new
                {
                    STT = i + 1,
                    idwarehouse = g.Key.IdWareHouse,
                    namewarehouse = g.Key.Name,
                    count = g.Sum(item => item.Inventory),
                    idgoods = g.Select(item => item.IdGoods).ToList(),
                }).ToList();

                return Json(new { code = 200, data });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult GetGoodsInWH(string idwarehouse, pagination pagination, Sort sort, DataForm.query query)
        {
            try
            {
                if (query == null)
                {
                    query = new DataForm.query();
                }
                if (query.idpurchase == null)
                    query.idpurchase = "";
                var sortField = sort == null ? "Id" : (sort.field == null ? "Id" : sort.field);
                var querys = db.DetailWareHouses.Where(x => x.IdWareHouse == idwarehouse.Trim() && !x.IdGoods.Contains("J")).ToList().AsQueryable();
                
                var filtered = querys.Where(p => p.Inventory > 0).Select((p) => new
                {
                    idgoods = p.IdGoods,
                    name = p.Good.Name,
                    qtt = p.Inventory,
                    unit = p.Good.IdUnit != null ? p.Good.Unit.Name : "",
                    category = p.Good.IdGroupGood != null ? p.Good.GroupGood.Name : ""
                }).Where(x => x.idgoods.Contains(query.idpurchase.Trim()) || x.name.Contains(query.idpurchase.Trim())).ToList();

                var result = filtered.Select((p, i) => new
                {
                    STT = i + 1,
                    p.idgoods,
                    p.name,
                    p.qtt,
                    p.unit,
                    p.category,
                }).ToList().AsQueryable();

                //if (sort.field == "STT")
                //{
                //    result = (sort.sort == "desc")
                //        ? result.OrderBy($"{sortField} DESC")
                //        : result.OrderBy(sortField);
                //}
                //else
                //{

                //}
                result = result.OrderBy(sortField);
                if (sort.sort == "desc")
                {
                    result = result.OrderBy($"{sortField} DESC");
                }

                var data = result.Skip((pagination.page - 1) * pagination.perpage).Take(pagination.perpage).ToList();
                var pages = (int)Math.Ceiling((double)result.Count() / pagination.perpage);
                var total = result.Count();
                var meta = new
                {
                    page = pagination.page,
                    pages = pages,
                    perpage = pagination.perpage,
                    total = total,
                    sort = sort.sort,
                    field = sort.field
                };
                //var data = db.DetailWareHouses.Where(x => x.IdWareHouse == idwarehouse.Trim()).ToList()
                //           .AsEnumerable()
                //           .Select((p, i) => new
                //           {
                //               STT = i + 1,
                //               idgoods = p.IdGoods,
                //               name = p.Good.Name,
                //               qtt = p.Inventory,
                //               unit = p.Good.IdUnit != null ? p.Good.Unit.Name : "",
                //               category = p.Good.IdGroupGood != null ? p.Good.GroupGood.Name : ""
                //           })
                //           .ToList()
                //           .Where(x => x.qtt > 0)
                //           .ToList();
                return Json(new { code = 200, data, meta });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult GetGoodEPCs(string idwarehouse, string idgoods)
        {
            try
            {
                var data = db.DetailWareHouses
                                .Join(db.EPCs,
                                    e => new { e.IdGoods, e.IdWareHouse },
                                    d => new { d.IdGoods, d.IdWareHouse },
                                    (e, d) => new { e, d })
                                .Where(x => x.e.IdWareHouse == idwarehouse && x.e.IdGoods == idgoods && x.d.Status == true)
                                .AsEnumerable()
                                .Select((x, i) => new
                                {
                                    STT = i + 1,
                                    idgoods = x.e.IdGoods,
                                    namewarehouse = x.e.WareHouse.Name,
                                    nameGood = db.Goods.FirstOrDefault(g => g.Id == x.e.IdGoods).Name,
                                    idEPC = x.d.IdEPC,
                                    SearchStatus = x.d.SearchStatus,
                                    idSerial = x.d.IdSerial
                                })
                                .ToList();
                return Json(new { code = 200, data });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpGet]
        public ActionResult MoveGoodsinWH()
        {
            return View();
        }

        [HttpGet]
        public JsonResult ShowDetailWareHouse(string idwarehouse, string idgoods)
        {
            try
            {
                var list = db.DetailWareHouses
                    .Where(b => b.IdWareHouse.Contains(idwarehouse))
                    .GroupBy(b => new { b.IdWareHouse, b.WareHouse.Name })
                    .Select(g => new
                    {
                        idwarehouse = g.Key.IdWareHouse,
                        namewarehouse = g.Key.Name,
                        count = g.Sum(item => item.Inventory),
                        idgoods = g.Select(item => item.IdGoods).ToList()
                    }).ToList();

                var goods = (from p in db.DetailWareHouses
                             where p.IdWareHouse == idwarehouse
                             select new
                             {
                                 idgoods = p.IdGoods,
                                 name = p.Good.Name,
                                 qtt = p.Inventory,
                             }).ToList();
                var epcInGoods = (from e in db.DetailWareHouses
                                  join d in db.EPCs on new { e.IdGoods, e.IdWareHouse } equals new { d.IdGoods, d.IdWareHouse }
                                  where e.IdWareHouse == idwarehouse && e.IdGoods == idgoods
                                  select new
                                  {
                                      idgoods = e.IdGoods,
                                      namewarehouse = e.WareHouse.Name,
                                      idEPC = d.IdEPC,
                                  }).ToList();

                return Json(new { code = 200, list, goods, epcInGoods }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult InventoryCheck(int page, int pageSize)
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.User1;
                var warehouses = db.WareHouses.ToList();
                var notifications = db.InventoryNotifies.ToList();
                const int CONDITIONNOTIFY = 2;
                foreach (var warehouse in warehouses)
                {
                    var warehouseId = warehouse.Id;
                    var warehouseName = warehouse.Name;
                    var minInventory = warehouse.MinInventory;
                    var maxInventory = warehouse.MaxInventory;
                    //Kiểm tra tổng tồn kho trong kho hàng
                    var totalInventory = db.DetailWareHouses.Where(x => x.IdWareHouse == warehouseId).Sum(x => x.Inventory);

                    // Kiểm tra xem thông báo đã tồn tại trong StockNotify chưa
                    var existNotify = notifications.FirstOrDefault(n => n.Warehouse == warehouseName && n.Goods == null && n.UserName == username);

                    if (totalInventory - minInventory <= CONDITIONNOTIFY)
                    {
                        if (existNotify == null)
                        {
                            // Tạo thông báo mới nếu chưa có trong StockNotify và tổng tồn kho không đủ
                            var newNotify = new InventoryNotify
                            {
                                IdWareHouse = warehouseId,
                                Warehouse = warehouseName,
                                Message = $"{rm.GetString("Tổng Lượng Tồn Hàng Hóa")} {rm.GetString("Trong")} {warehouseName} {rm.GetString("Còn")} {totalInventory}. ",
                                Status = true,
                                CreateDate = DateTime.Now,
                                NewInventory = totalInventory,
                                UserName = username
                            };

                            notifications.Add(newNotify);
                            db.InventoryNotifies.Add(newNotify);
                        }
                        else
                        {
                            existNotify.NewInventory = totalInventory;
                            existNotify.Message = $"{rm.GetString("Tổng Lượng Tồn Hàng Hóa")} {rm.GetString("Trong")} {warehouseName} {rm.GetString("Còn")} {totalInventory}. ";
                        }
                    }
                    else if (maxInventory - totalInventory <= CONDITIONNOTIFY)
                    {
                        if (existNotify == null)
                        {
                            // Tạo thông báo mới nếu chưa có trong StockNotify và tổng tồn kho không đủ
                            var newNotify = new InventoryNotify
                            {
                                IdWareHouse = warehouseId,
                                Warehouse = warehouseName,
                                Message = $"{rm.GetString("Tổng Lượng Tồn Hàng Hóa")} {rm.GetString("Trong")} {warehouseName} {rm.GetString("Sắp Đầy!")}. ",
                                Status = true,
                                CreateDate = DateTime.Now,
                                NewInventory = totalInventory,
                                UserName = username
                            };

                            notifications.Add(newNotify);
                            db.InventoryNotifies.Add(newNotify);
                        }
                        else
                        {
                            existNotify.NewInventory = totalInventory;
                            existNotify.Message = $"{rm.GetString("Tổng Lượng Tồn Hàng Hóa")} {rm.GetString("Trong")} {warehouseName} {rm.GetString("Sắp Đầy!")}. ";
                        }
                    }
                    else
                    {
                        if (existNotify != null)
                        {
                            // Xóa thông báo trong StockNotify nếu tổng tồn kho đã đủ và thông báo đã tồn tại
                            db.InventoryNotifies.Remove(existNotify);
                            notifications.Remove(existNotify);
                        }
                    }
                }

                db.SaveChanges();

                var warehouseNoti = db.InventoryNotifies.Where(x => x.IdGoods == null && x.UserName == username)
                                    .OrderBy(x => x.Warehouse)
                                    .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                    .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                    .ToList();

                // hiển thị số lượng thông tin có trạng thái là true
                var numNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username && x.IdGoods == null).Count();


                var countTotal = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods == null).ToList().Count();

                return Json(new { code = 200, warehouseNoti, numNotify, countTotal }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult InventoryNotifyClicked(string message)
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.User1;

                foreach (var stockNotify in db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username))
                {
                    if (stockNotify.Message.Trim() == message.Trim())
                    {
                        stockNotify.Status = false;
                    }
                }

                db.SaveChanges();

                var numNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username).Count();
                return Json(new { code = 200, numNotify }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        public ActionResult DownloadExampleFile()
        {
            // Đường dẫn vật lý tới file
            try
            {
                using (ExcelPackage excelPackage = new ExcelPackage())
                {
                    // Tạo một worksheet mới
                    var worksheet = excelPackage.Workbook.Worksheets.Add(rm.GetString("warehouses_data"));

                    // Định dạng màu
                    var titleColor = System.Drawing.Color.FromArgb(0, 123, 255); // Màu xanh nước
                    var subtitleColor = System.Drawing.Color.FromArgb(85, 85, 85); // Màu xám nhạt
                    var headerColor = System.Drawing.Color.FromArgb(255, 255, 0); // Màu vàng

                    // Tiêu đề cột
                    var headers = new[] { rm.GetString("warehouse_name"), rm.GetString("description"), rm.GetString("warehouse_min"), rm.GetString("warehouse_max") };
                    for (int i = 0; i < headers.Length; i++)
                    {
                        worksheet.Cells[1, i + 1].Value = headers[i];
                        worksheet.Cells[1, i + 1].Style.Font.Bold = true;
                        worksheet.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        worksheet.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(headerColor);
                        worksheet.Cells[1, i + 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    }

                    // Dữ liệu mẫu
                    worksheet.Cells[2, 1].Value = rm.GetString("enter_wh_excel");
                    worksheet.Cells[2, 2].Value = rm.GetString("enter_wh_des");
                    worksheet.Cells[2, 3].Value = rm.GetString("enter_minimum_qty_excel");
                    worksheet.Cells[2, 4].Value = rm.GetString("enter_maximum_qty_excel");


                    worksheet.Column(1).AutoFit();
                    worksheet.Column(2).AutoFit();
                    worksheet.Column(3).AutoFit();
                    worksheet.Column(4).AutoFit();
                    worksheet.View.FreezePanes(2, 1);

                    // Lấy file Excel dưới dạng byte array
                    var fileContent = excelPackage.GetAsByteArray();
                    var fileName = rm.GetString("warehouse_template");


                    return Json(new { code = 200, msg = rm.GetString("sample_download_success"), fileContent = Convert.ToBase64String(fileContent), fileName = fileName }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetWHName(string idWH)
        {
            try
            {
                if (string.IsNullOrEmpty(idWH))
                {
                    return Json(new { code = 500, msg = rm.GetString("warehouse_error_id") });
                }
                var getWH = db.WareHouses.SingleOrDefault(x => x.Id == idWH);
                if (getWH == null)
                {
                    return Json(new { code = 500, msg = rm.GetString("warehouse_error_unknown") });
                }
                else
                {
                    return Json(new { code = 200, nameWH = getWH.Name });
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpGet]
        public JsonResult GetAllWareHouse(string id)
        {
            try
            {
                var h = (from b in db.WareHouses.Where(x => x.Id.Length > 0 && x.Id != id)
                         select new
                         {
                             id = b.Id,
                             name = b.Name
                         }).ToList();

                return Json(new { code = 200, data = h }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetNewTransportationSO()
        {
            try
            {
                DateTime now = DateTime.Now;
                string date = now.ToString("yyyyMMdd");
                string temp = date;
                string response = "";
                var res = db.SalesOrders.Where(w => w.Id.Contains(temp));

                if (res.Count() > 0)
                {
                    var item = res.ToList().LastOrDefault().Id;
                    string numberPart = item.Substring(item.LastIndexOf('-') + 1);
                    int number = int.Parse(numberPart);
                    response = "FG-SO" + temp + "-" + (number + 1).ToString("D5");
                }
                else
                    response = "FG-SO" + temp + "-00001";
                return Json(new { code = 200, data = response }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }

        }

        [HttpPost]
        public async Task<JsonResult> CreateTransportation(TransportationRequestDto request)
        {
            try
            {
                if (request == null)
                {
                    return Json(new { code = 500, msg = rm.GetString("warehouse_fw_req_err") });
                }
                var session = (Models.User)Session["user"];
                //Tạo phiếu xuất kho
                var saleOrder = new SalesOrder
                {
                    Id = request.IdSO,
                    IdWareHouse = request.WarehouseID,
                    CreateBy = session.Name,
                    CreateDate = DateTime.Now,
                    Description = request.Note,
                    Status = false,
                    HandlingStatus = request.HandlingStatusID,
                    IdTypeStatus = 1,
                    ForwardingWH = request.ImportWarehouseID
                };
                var listGoods = new List<DetailSaleOrder>();
                double? countTotal = 0;
                foreach (var goods in request.GoodsList)
                {
                    countTotal += goods.Qty;
                    listGoods.Add(new DetailSaleOrder
                    {
                        IdGoods = goods.Id,
                        Quantity = goods.Qty,
                        IdSaleOrder = saleOrder.Id,
                        CreateBy = session.Name,
                        CreateDate = DateTime.Now,
                        Status = false,
                    });
                }

                var minimunStock = db.WareHouses
                    .AsNoTracking()
                    .Where(wh => wh.Id == request.WarehouseID)
                    .Select(wh => wh.MinInventory)
                    .FirstOrDefault();

                if (minimunStock > 0)
                {

                    var listUnconfirmSaleOrder = db.SalesOrders
                        .AsNoTracking()
                        .Where(x => x.IdWareHouse == request.WarehouseID && x.HandlingStatus == 1)
                        .ToList();

                    var currentGoodsStock = db.Goods
                        .AsNoTracking()
                        .Where(g => g.IdWareHouse == request.WarehouseID)
                        .Sum(g => g.Inventory);

                    var totalGoodsInUnconfirmSaleOrder = listUnconfirmSaleOrder
                        .SelectMany(order => order.DetailSaleOrders)
                        .GroupBy(detail => detail.IdGoods)
                        .Sum(group => group.Sum(detail => detail.Quantity));

                    var totalGoodsInCurrentSaleOrder = request.GoodsList
                        .GroupBy(good => good.Id)
                        .Sum(group => group.Sum(good => good.Qty));

                    if (currentGoodsStock - (totalGoodsInCurrentSaleOrder + totalGoodsInUnconfirmSaleOrder) < minimunStock)
                    {
                        return Json(new { code = 500, message = rm.GetString("warehouse_fw_create_note") });
                    }
                }
                string listSaleOrderWithThisGoods = "";
                bool isWrongCase = false;
                foreach (var item in request.GoodsList)
                {
                    var thisGoodsCurrentStock = db.Goods.AsNoTracking()
                                                        .Where(x => x.Id == item.Id && x.IdWareHouse == request.WarehouseID)
                                                        .Select(x => x.Inventory)
                                                        .FirstOrDefault();

                    var thisGoodsInOtherUnconfirmSaleOrder = db.SalesOrders.AsNoTracking()
                                                                           .Where(x => x.IdWareHouse == request.WarehouseID && x.HandlingStatus == 1)
                                                                           .SelectMany(x => x.DetailSaleOrders)
                                                                           .Where(x => x.IdGoods == item.Id).ToList();

                    if (item.Qty + thisGoodsInOtherUnconfirmSaleOrder.Sum(x => x.Quantity) > thisGoodsCurrentStock)
                    {
                        isWrongCase = true;
                        foreach (var item2 in thisGoodsInOtherUnconfirmSaleOrder)
                        {
                            listSaleOrderWithThisGoods += $"{rm.GetString("warehouse_fw_so_err")} {item2.IdSaleOrder} {rm.GetString("warehouse_fw_so_contain_err")} {item2.IdGoods} {rm.GetString("warehouse_fw_so_quantity_err")} {item2.Quantity}<br><br><br>";
                        }
                    }
                }
                if (isWrongCase)
                {
                    return Json(new { code = 500, message = listSaleOrderWithThisGoods });
                }
                db.SalesOrders.Add(saleOrder);
                db.DetailSaleOrders.AddRange(listGoods);
                ////Check kho nhập có đủ số lượng chứa điều chuyển ko
                var ttSum = countTotal; // số lượng cbi nhập
                var idWareHouse = Request.Form["warehouse"]; // lấy mã kho hàng
                var maxInvetory = db.WareHouses.Find(request.ImportWarehouseID).MaxInventory; // số lượng kho chứa lớn nhất
                                                                                              //tổng số lượng hàng kho hiện đang có
                var totalInventory = db.DetailWareHouses.Where(d => d.IdWareHouse == request.ImportWarehouseID)
                   .GroupBy(d => d.IdWareHouse)
                   .Select(g => new
                   {
                       IdWareHouse = g.Key,
                       TotalInventory = g.Sum(d => d.Inventory)
                   }).FirstOrDefault();
                var sumInventory = totalInventory == null ? 0 : totalInventory.TotalInventory; //tổng số lượng hàng kho hiện đang có
                                                                                               //tong sl chuan bi nhap vao kho
                var totalQuantity = db.DetailGoodOrders
                    .Where(d => d.PurchaseOrder.IdWareHouse == request.ImportWarehouseID && d.HandlingStatus != 2)
                    .Sum(d => d.Quantity);

                totalQuantity = totalQuantity == null ? 0 : totalQuantity;//tong sl chuan bi nhap vao kho

                //tong so luong cua kho va cac sl cbi nhap kho
                var ttqtt = totalQuantity + ttSum + sumInventory;
                //so sánh với lượng hàng có thể nhập vào kho
                if (ttqtt >= maxInvetory)
                {
                    return Json(new { code = 500, message = rm.GetString("warehouse_fw_more") });
                }

                //PurchaseOrder purchaseOrder = new PurchaseOrder()
                //{
                //    IdWareHouse = request.ImportWarehouseID,
                //    //IdCustomer = Request.Form["customer"] == "-1" ? null : Request.Form["customer"],
                //    //Name = Request.Form["name"],
                //    //Deliver = Request.Form["deliver"],
                //    Description = request.Note,
                //    CreateBy = session.Name,
                //    CreateDate = DateTime.Now,
                //    ModifyBy = session.Name,
                //    ModifyDate = DateTime.Now,
                //    Status = false,
                //    HandlingStatus = 1,
                //    IdTypeStatus = 1
                //};
                ////var id = Request.Form["poNumber"];
                ////var checkId = new PurchaseOrder();
                ////do
                ////{
                ////    id = await Encode.GenerateRandomString(7);
                ////    checkId = db.PurchaseOrders.Find(id);
                ////} while (checkId != null);
                //string id = "";
                //DateTime now = DateTime.Now;
                //string date = now.ToString("yyyyMMdd");
                //string temp = date;
                //var res = db.PurchaseOrders.Where(w => w.Id.Contains(temp));

                //if (res.Count() > 0)
                //{
                //    var item = res.ToList().LastOrDefault().Id;
                //    string numberPart = item.Substring(item.LastIndexOf('-') + 1);
                //    int number = int.Parse(numberPart);
                //    id = "PO" + temp + "-" + (number + 1).ToString("D5");
                //}
                //else
                //{
                //    id = "PO" + temp + "-00001";
                //}
                //purchaseOrder.Id = id;
                //List<DetailGoodOrder> data = new List<DetailGoodOrder>();

                //foreach (var goods in request.GoodsList)
                //{
                //    data.Add(new DetailGoodOrder()
                //    {
                //        IdGoods = goods.Id,
                //        Quantity = goods.Qty,
                //        CreateBy = session.Name,
                //        ModifyBy = session.Name,
                //        CreateDate = DateTime.Now,
                //        ModifyDate = DateTime.Now,
                //        IdPurchaseOrder = id,
                //        Status = false,
                //        HandlingStatus = 1,
                //    });
                //}

                //db.PurchaseOrders.Add(purchaseOrder);
                //db.DetailGoodOrders.AddRange(data);
                var result = await db.SaveChangesAsync();
                if (result <= 0)
                {
                    return Json(new { code = 500, message = rm.GetString("warehouse_fw_create_fail") });
                }
                else
                {
                    return Json(new { code = 200, message = rm.GetString("warehouse_fw_create_success") });
                }

            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult ApproveDeliveryMoveGoods(List<string> ids)
        {
            try
            {
                var session = (Models.User)Session["user"];

                if (!author.CheckPer("Duyệt Phiếu", session)) { return Json(new { code = 500, message = rm.GetString("approve_auth") }); }
                if (ids == null)
                {
                    return Json(new { code = 500, msg = rm.GetString("approve_none") });
                }
                if (ids.Count() == 0)
                {
                    return Json(new { code = 500, msg = rm.GetString("approve_none") });
                }


                var fileList = new List<object>(); // Lưu nội dung các file Excel

                foreach (var id in ids)
                {
                    var getListEPC = new List<EPC>();
                    var delivery = db.Deliveries.FirstOrDefault(x => x.Id == id);
                    var saleOrder = db.SalesOrders.FirstOrDefault(x => x.Id == delivery.IdSalesOrder);
                    if (delivery != null && delivery.Status == false && delivery.HandlingStatus == 1)
                    {
                        var listGoods = db.EPCs.Where(x => x.IdDelivery == delivery.Id);
                        foreach (var good in listGoods)
                        {
                            var getWH = db.DetailWareHouses.FirstOrDefault(x => x.IdWareHouse == delivery.IdWareHouse && x.IdGoods == good.IdGoods);
                            getWH.Inventory -= 1;
                            var getGood = db.Goods.FirstOrDefault(x => x.Id == good.IdGoods);
                            getGood.Inventory -= 1;

                            good.ExportStatus = true;
                            good.Status = false;

                            getListEPC.Add(good);
                        }
                        //db.EPCs.RemoveRange(listGoods);

                        delivery.HandlingStatus = 2;
                        delivery.Status = true;

                        //Tạo phiếu nhập kho
                        PurchaseOrder purchaseOrder = new PurchaseOrder()
                        {
                            IdWareHouse = saleOrder.ForwardingWH,
                            //IdCustomer = Request.Form["customer"] == "-1" ? null : Request.Form["customer"],
                            //Name = Request.Form["name"],
                            //Deliver = Request.Form["deliver"],
                            Description = saleOrder.Description,
                            CreateBy = session.Name,
                            CreateDate = DateTime.Now,
                            ModifyBy = session.Name,
                            ModifyDate = DateTime.Now,
                            Status = false,
                            HandlingStatus = 1,
                            IdTypeStatus = 1,
                            ForwarderSO = id
                        };

                        //string id = "";
                        //DateTime now = DateTime.Now;
                        //string date = now.ToString("yyyyMMdd");
                        //string temp = date;

                        DateTime now = DateTime.Now;
                        string date = now.ToString("yyyyMMdd");
                        string temp = "FG-PO" + date;
                        string response = "";
                        var res = db.PurchaseOrders.Where(w => w.Id.Contains(temp));

                        if (res.Count() > 0)
                        {
                            var item = res.ToList().LastOrDefault().Id;
                            string numberPart = item.Substring(item.LastIndexOf('-') + 1);
                            int number = int.Parse(numberPart);
                            response = temp + "-" + (number + 1).ToString("D5");
                        }
                        else
                            response = temp + "-00001";

                        purchaseOrder.Id = response;
                        List<DetailGoodOrder> dataGO = new List<DetailGoodOrder>();
                        var listGoodsInDelivery = db.DetailDeliveries.Where(x => x.IdDelivery == id).ToList();

                        foreach (var goods in listGoodsInDelivery)
                        {
                            dataGO.Add(new DetailGoodOrder()
                            {
                                IdGoods = goods.IdGood,
                                Quantity = goods.QuantityScan,
                                CreateBy = session.Name,
                                ModifyBy = session.Name,
                                CreateDate = DateTime.Now,
                                ModifyDate = DateTime.Now,
                                IdPurchaseOrder = purchaseOrder.Id,
                                Status = false,
                                HandlingStatus = 1,
                            });
                        }

                        db.PurchaseOrders.Add(purchaseOrder);
                        db.DetailGoodOrders.AddRange(dataGO);

                        db.SaveChanges();

                        //var fileName = "Dieu_Chuyen_" + response + "_" + DateTime.Now.ToString("yyyyMMddHHmmss") + ".xlsx";
                        //var filePath = Path.Combine(Server.MapPath("~/Temp"), fileName);

                        //using (ExcelPackage excelPackage = new ExcelPackage())
                        //{
                        //    // Tạo một worksheet mới
                        //    var worksheet = excelPackage.Workbook.Worksheets.Add("Import EPC Data");

                        //    List<ImportEPC> datas = new List<ImportEPC>();

                        //    ImportEPC data = new ImportEPC()
                        //    {
                        //        C1 = "ID",
                        //        C2 = "EPC"
                        //    };

                        //    datas.Add(data);

                        //    foreach (var epc in getListEPC)
                        //    {
                        //        ImportEPC dataEPC = new ImportEPC()
                        //        {
                        //            C1 = epc.IdGoods,
                        //            C2 = epc.IdEPC
                        //        };

                        //        datas.Add(dataEPC);
                        //    }

                        //    // Thêm dữ liệu vào file
                        //    for (int i = 0; i < datas.Count; i++)
                        //    {
                        //        for (int j = 0; j < 2; j++)
                        //        {
                        //            var propertyName = "C" + (j + 1);
                        //            var property = typeof(ImportEPC).GetProperty(propertyName);
                        //            var propertyValue = property.GetValue(datas[i]);
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Value = propertyValue;
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Top.Style = ExcelBorderStyle.Hair;
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Top.Color.SetColor(System.Drawing.Color.Black);
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Bottom.Style = ExcelBorderStyle.Hair;
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Bottom.Color.SetColor(System.Drawing.Color.Black);
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Left.Style = ExcelBorderStyle.Hair;
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Left.Color.SetColor(System.Drawing.Color.Black);
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Right.Style = ExcelBorderStyle.Hair;
                        //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Right.Color.SetColor(System.Drawing.Color.Black);
                        //            if (i == 0) // Nếu là hàng đầu tiên
                        //            {
                        //                worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        //                worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(255, 255, 0));
                        //            }
                        //        }
                        //    }
                        //    worksheet.Column(1).AutoFit();
                        //    worksheet.Column(2).AutoFit();
                        //    worksheet.View.FreezePanes(2, 1);

                        //    // Lấy file Excel dưới dạng byte array
                        //    var fileContent = (excelPackage.GetAsByteArray());
                        //    var base64String = Convert.ToBase64String(fileContent);
                        //    fileList.Add(new
                        //    {
                        //        fileName = fileName,
                        //        fileContentBase64 = base64String
                        //    });
                        //}
                    }
                }
                return Json(new { code = 200, msg = rm.GetString("export_success"), fileList = fileList });
                //// Trả về JSON với URL của file và mã trạng thái 200
                //var fileUrl = Url.Content("~/Temp/" + fileName);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        public static string GetExcelColumnName(int columnNumber)
        {
            int dividend = columnNumber;
            string columnName = string.Empty;
            int modulo;
            while (dividend > 0)
            {
                modulo = (dividend - 1) % 26;
                columnName = Convert.ToChar(65 + modulo).ToString() + columnName;
                dividend = (int)((dividend - modulo) / 26);
            }

            return columnName;
        }

        public JsonResult ExportPDF()
        {
            try
            {
                var session = (Models.User)Session["User"];
                // Tạo đường dẫn tới file tạm trong thư mục Temp
                string tempFilePath = Path.Combine(Path.GetTempPath(), "Kho_hang.pdf");

                string fontPath = Server.MapPath("~/fonts/tahoma.ttf");

                var c = db.WareHouses.Select(x => new
                {
                    x.Name,
                    x.Description,
                    x.CreateDate,
                    x.CreateBy,
                    x.MinInventory,
                    x.MaxInventory,
                    x.ModifyDate,
                    x.ModifyBy
                }).ToList();

                // Thiết lập mã hóa và mật khẩu cho file PDF
                var writerProperties = new WriterProperties()
                    .SetStandardEncryption(
                        null, // Người dùng không cần mật khẩu để mở PDF
                        Encoding.UTF8.GetBytes("password"), // Mật khẩu để hạn chế quyền
                        EncryptionConstants.ALLOW_PRINTING,
                        EncryptionConstants.ENCRYPTION_AES_128
                    );

                // Tạo file PDF và lưu vào thư mục tạm
                using (var pdfDocument = new PdfDocument(new PdfWriter(tempFilePath, writerProperties)))
                {
                    // Load font Tahoma từ file .ttf (font hỗ trợ tiếng Việt)
                    var font = PdfFontFactory.CreateFont(fontPath, PdfEncodings.IDENTITY_H);

                    var document = new Document(pdfDocument);

                    // Áp dụng font Tahoma cho toàn bộ văn bản trong tài liệu
                    document.SetFont(font);

                    var getHeaderPath = Server.MapPath("~/PrintDetail/DataBill.js"); // Đường dẫn tới file
                    if (System.IO.File.Exists(getHeaderPath))
                    {
                        // Đọc toàn bộ nội dung file
                        string jsContent = System.IO.File.ReadAllText(getHeaderPath);

                        // Lấy JSON từ biến trong file (nếu cần, bạn có thể dùng regex để trích xuất)
                        string jsonContent = jsContent.Replace("var dataBill =", "").Trim(';').Trim();

                        // Parse JSON thành Dictionary
                        var data = JsonConvert.DeserializeObject<Dictionary<string, string>>(jsonContent);

                        // Tiêu đề
                        document.Add(new Paragraph(data["header1"])
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(20)
                            .SetBold()
                            .SetFontColor(new DeviceRgb(0, 123, 255)));

                        document.Add(new Paragraph(data["header2"])
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(12)
                            .SetFontColor(new DeviceRgb(85, 85, 85)));
                    }
                    else
                    {
                        // Tiêu đề
                        document.Add(new Paragraph("CÔNG TY TNHH XYZ")
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(20)
                            .SetBold()
                            .SetFontColor(new DeviceRgb(0, 123, 255)));

                        document.Add(new Paragraph("Địa chỉ: 123 Đường ABC, TP. HCM")
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(12)
                            .SetFontColor(new DeviceRgb(85, 85, 85)));
                    }

                    document.Add(new Paragraph(rm.GetString("warehouse_print"))
                        .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                        .SetFontSize(16)
                        .SetBold()
                        .SetFontColor(new DeviceRgb(0, 123, 255)));

                    document.Add(new Paragraph($"{rm.GetString("print_time")}: {DateTime.Now:dd-MM-yyyy}")
                        .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                        .SetFontSize(12)
                        .SetFontColor(new DeviceRgb(85, 85, 85)));

                    // Tạo LineSeparator với màu xanh nước
                    var lineSeparator = new LineSeparator(new SolidLine(1)).SetStrokeColor(new DeviceRgb(0, 123, 255));
                    document.Add(lineSeparator);

                    // Thông tin chung
                    document.Add(new Paragraph($"{rm.GetString("account_print")}: {session.Name}")
                        .SetFontSize(12)
                        .SetBold()
                        .SetFontColor(new DeviceRgb(51, 51, 51)));

                    // Tạo một bảng trong PDF (ví dụ: 4 cột)
                    var table = new iText.Layout.Element.Table(UnitValue.CreatePercentArray(8)).UseAllAvailableWidth();

                    var yellowColor = new DeviceRgb(255, 255, 0); // Màu vàng

                    // Thêm tiêu đề cột
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("warehouse_name"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("description"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("warehouse_min"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("warehouse_max"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("create_date"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("create_by"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("modify_date"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("modify_by"))).SetBackgroundColor(yellowColor));

                    foreach (var group in c)
                    {
                        table.AddCell(group.Name != null ? group.Name : "");
                        table.AddCell(group.Description != null ? group.Description : "");
                        table.AddCell(group.MinInventory != null ? group.MinInventory.ToString() : "");
                        table.AddCell(group.MaxInventory != null ? group.MaxInventory.ToString() : "");
                        table.AddCell(group.CreateDate.HasValue ? group.CreateDate.Value.ToString("dd-MM-yyyy") : "");
                        table.AddCell(group.CreateBy != null ? group.CreateBy : "");
                        table.AddCell(group.ModifyDate.HasValue ? group.ModifyDate.Value.ToString("dd-MM-yyyy") : "");
                        table.AddCell(group.ModifyBy != null ? group.ModifyBy : "");
                    }

                    // Thêm bảng vào tài liệu
                    document.Add(table);

                    // Đóng tài liệu và tạo file PDF
                    document.Close();
                }

                //// Tạo một đối tượng PdfDocument
                //var pdfDocument = new PdfDocument(new PdfWriter(tempFilePath));
                //var document = new Document(pdfDocument);

                // Trả về file PDF cho người dùng tải về
                var filePath = "Kho hàng";
                var fileBytes = System.IO.File.ReadAllBytes(tempFilePath);
                // Mã hóa fileBytes thành chuỗi Base64
                var fileBase64 = Convert.ToBase64String(fileBytes);

                // Xóa file sau khi đã đọc xong để giải phóng bộ nhớ
                System.IO.File.Delete(tempFilePath);

                return Json(new { code = 200, msg = rm.GetString("pdf"), fileContent = fileBase64, fileName = filePath }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult ExportCSV()
        {
            try
            {
                var session = (Models.User)Session["User"];
                var c = db.WareHouses.Select(x => new
                {
                    x.Name,
                    x.Description,
                    x.CreateDate,
                    x.CreateBy,
                    x.MinInventory,
                    x.MaxInventory,
                    x.ModifyDate,
                    x.ModifyBy
                }).ToList();

                // Tạo file CSV
                var sb = new StringBuilder();

                var getHeaderPath = Server.MapPath("~/PrintDetail/DataBill.js"); // Đường dẫn tới file
                if (System.IO.File.Exists(getHeaderPath))
                {
                    // Đọc toàn bộ nội dung file
                    string jsContent = System.IO.File.ReadAllText(getHeaderPath);

                    // Lấy JSON từ biến trong file (nếu cần, bạn có thể dùng regex để trích xuất)
                    string jsonContent = jsContent.Replace("var dataBill =", "").Trim(';').Trim();

                    // Parse JSON thành Dictionary
                    var data = JsonConvert.DeserializeObject<Dictionary<string, string>>(jsonContent);

                    sb.AppendLine($"\"{data["header1"]}\""); // Tên công ty
                    sb.AppendLine($"\"{data["header2"]}\""); // Địa chỉ công ty
                }
                else
                {
                    sb.AppendLine("\"Công ty XYZ\""); // Tên công ty
                    sb.AppendLine("\"Địa chỉ: 123 Đường ABC, TP. HCM\""); // Địa chỉ công ty    
                }
                sb.AppendLine(rm.GetString("warehouse_print"));
                sb.AppendLine();
                sb.AppendLine($"{rm.GetString("print_time")}: {DateTime.Now:dd-MM-yyyy}");
                sb.AppendLine($"{rm.GetString("account_print")}: {session.Name}");
                sb.AppendLine();

                // Thêm tiêu đề cột vào CSV
                sb.AppendLine($"{rm.GetString("warehouse_name")},{rm.GetString("description")},{rm.GetString("warehouse_min")},{rm.GetString("warehouse_max")},{rm.GetString("create_date")},{rm.GetString("create_by")},{rm.GetString("modify_date")},{rm.GetString("modify_by")}");

                // Thêm dữ liệu vào CSV
                foreach (var item in c)
                {
                    sb.AppendLine($"{item.Name},{item.Description},{item.MinInventory.ToString()},{item.MaxInventory.ToString()},{item.CreateDate:dd-MM-yyyy}, {item.CreateBy},{item.ModifyDate:dd-MM-yyyy}, {item.ModifyBy}");
                }

                // Tạo file CSV tạm thời
                var filePath = Path.Combine(Path.GetTempPath(), "Kho_hang.csv");

                // Ghi vào file
                System.IO.File.WriteAllText(filePath, sb.ToString(), Encoding.UTF8);

                // Trả về file cho người dùng tải về
                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                // Mã hóa fileBytes thành chuỗi Base64
                var fileBase64 = Convert.ToBase64String(fileBytes);

                var fileName = "Kho hàng";
                // Xóa file CSV tạm sau khi trả về
                System.IO.File.Delete(filePath);


                return Json(new { code = 200, msg = rm.GetString("csv"), fileContent = fileBase64, fileName = fileName }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult ExportExcel()
        {
            try
            {
                var session = (Models.User)Session["User"];
                var c = db.WareHouses.Select(x => new
                {
                    x.Name,
                    x.Description,
                    x.CreateDate,
                    x.CreateBy,
                    x.MinInventory,
                    x.MaxInventory,
                    x.ModifyDate,
                    x.ModifyBy
                }).ToList();

                var fileName = rm.GetString("warehouse");
                var filePath = Path.Combine(Path.GetTempPath(), fileName);

                using (ExcelPackage excelPackage = new ExcelPackage())
                {
                    // Tạo một worksheet mới
                    var worksheet = excelPackage.Workbook.Worksheets.Add(rm.GetString("warehouses_data"));

                    // Định dạng màu
                    var titleColor = System.Drawing.Color.FromArgb(0, 123, 255); // Màu xanh nước
                    var subtitleColor = System.Drawing.Color.FromArgb(85, 85, 85); // Màu xám nhạt
                    var headerColor = System.Drawing.Color.FromArgb(255, 255, 0); // Màu vàng

                    worksheet.Cells["A1:D1"].Merge = true;
                    worksheet.Cells["A1"].Value = rm.GetString("warehouse_print");
                    worksheet.Cells["A1"].Style.Font.Bold = true;
                    worksheet.Cells["A1"].Style.Font.Size = 14;
                    worksheet.Cells["A1"].Style.Font.Color.SetColor(titleColor);
                    worksheet.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                    // Thông tin chung
                    worksheet.Cells["A3"].Value = $"{rm.GetString("print_time")}: {DateTime.Now:dd-MM-yyyy}";
                    worksheet.Cells["A4"].Value = $"{rm.GetString("account_print")}: {session.Name}";

                    //List<EightColumnExcel> datas = new List<EightColumnExcel>();

                    //EightColumnExcel data = new EightColumnExcel()
                    //{
                    //    C1 = "Tên đơn vị",
                    //    C2 = "Mô tả",
                    //    C3 = "Hàng tồn kho thấp nhất",
                    //    C4 = "Hàng tồn kho cao nhất",
                    //    C5 = "Ngày tạo",
                    //    C6 = "Người tạo",
                    //    C7 = "Ngày chỉnh sửa",
                    //    C8 = "Người chỉnh sửa"
                    //};

                    //datas.Add(data);

                    //foreach (var group in c)
                    //{
                    //    EightColumnExcel dataGroup = new EightColumnExcel()
                    //    {
                    //        C1 = group.Name,
                    //        C2 = group.Description,
                    //        C3 = group.MinInventory.ToString(),
                    //        C4 = group.MaxInventory.ToString(),
                    //        C5 = group.CreateDate.HasValue ? group.CreateDate.Value.ToString("dd-MM-yyyy") : "",
                    //        C6 = group.CreateBy,
                    //        C7 = group.ModifyDate.HasValue ? group.ModifyDate.Value.ToString("dd-MM-yyyy") : "",
                    //        C8 = group.ModifyBy,
                    //    };

                    //    datas.Add(dataGroup);
                    //}

                    //// Thêm dữ liệu vào file
                    //for (int i = 0; i < datas.Count; i++)
                    //{
                    //    for (int j = 0; j < 8; j++)
                    //    {
                    //        var propertyName = "C" + (j + 1);
                    //        var property = typeof(EightColumnExcel).GetProperty(propertyName);
                    //        var propertyValue = property.GetValue(datas[i]);
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Value = propertyValue;
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Top.Style = ExcelBorderStyle.Hair;
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Top.Color.SetColor(System.Drawing.Color.Black);
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Bottom.Style = ExcelBorderStyle.Hair;
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Bottom.Color.SetColor(System.Drawing.Color.Black);
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Left.Style = ExcelBorderStyle.Hair;
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Left.Color.SetColor(System.Drawing.Color.Black);
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Right.Style = ExcelBorderStyle.Hair;
                    //        worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Border.Right.Color.SetColor(System.Drawing.Color.Black);
                    //        if (i == 0) // Nếu là hàng đầu tiên
                    //        {
                    //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    //            worksheet.Cells[GetExcelColumnName(j + 1) + (i + 1)].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(255, 255, 0));
                    //        }
                    //    }
                    //}

                    // Tiêu đề cột
                    var headers = new[] { rm.GetString("warehouse_name"), rm.GetString("description"), rm.GetString("warehouse_min"), rm.GetString("warehouse_max") };
                    for (int i = 0; i < headers.Length; i++)
                    {
                        worksheet.Cells[6, i + 1].Value = headers[i];
                        worksheet.Cells[6, i + 1].Style.Font.Bold = true;
                        worksheet.Cells[6, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        worksheet.Cells[6, i + 1].Style.Fill.BackgroundColor.SetColor(headerColor);
                        worksheet.Cells[6, i + 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    }

                    // Dữ liệu
                    int rowIndex = 7;
                    foreach (var g in c)
                    {
                        worksheet.Cells[rowIndex, 1].Value = g.Name;
                        worksheet.Cells[rowIndex, 2].Value = g.Description;
                        worksheet.Cells[rowIndex, 3].Value = g.MinInventory;
                        worksheet.Cells[rowIndex, 4].Value = g.MaxInventory;
                        rowIndex++;
                    }

                    worksheet.Column(1).AutoFit();
                    worksheet.Column(2).AutoFit();
                    worksheet.Column(3).AutoFit();
                    worksheet.Column(4).AutoFit();
                    worksheet.Column(5).AutoFit();
                    worksheet.Column(6).AutoFit();
                    worksheet.Column(7).AutoFit();
                    worksheet.Column(8).AutoFit();
                    worksheet.View.FreezePanes(2, 1);

                    // Lấy file Excel dưới dạng byte array
                    var fileContent = excelPackage.GetAsByteArray();


                    return Json(new { code = 200, msg = rm.GetString("excel"), fileContent = Convert.ToBase64String(fileContent), fileName = fileName }, JsonRequestBehavior.AllowGet);
                }
                //return Json(new { code = 200, msg = "Xuất file excel thành công", fileContent = fileBase64, fileName = fileName }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetPrintData()
        {
            try
            {
                var session = (Models.User)Session["user"];

                var whs = db.WareHouses.Select(x => new
                {
                    x.Name,
                    x.Description,
                    x.CreateDate,
                    x.CreateBy,
                    x.MinInventory,
                    x.MaxInventory,
                    x.ModifyDate,
                    x.ModifyBy
                }).ToList();
                var date = DateTime.Now.ToString("dd-MM-yyyy");
                return Json(new { code = 200, name = session.Name, list = whs, date = date });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult WhInventoryData()
        {
            try
            {
                var session = (Models.User)Session["user"];
                var detailWH = db.DetailWareHouses
                .GroupBy(b => new { b.IdWareHouse, b.WareHouse.Name })
                .AsEnumerable()
                .Select((g, i) => new
                {
                    idwarehouse = g.Key.IdWareHouse,
                    namewarehouse = g.Key.Name,
                    count = g.Sum(item => item.Inventory),
                }).ToList();

                var listEPC = db.EPCs.Where(x => x.Status == true)
                                     .Select(x => new
                                     {
                                         x.IdGoods,
                                         Name = db.Goods.FirstOrDefault(g => g.Id == x.IdGoods).Name,
                                         x.IdWareHouse,
                                         x.IdEPC
                                     })
                                     .OrderBy(item => item.Name)
                                     .ToList();
                var date = DateTime.Now.ToString("dd-MM-yyyy");
                return Json(new { code = 200, name = session.Name, listWH = detailWH, listEPC = listEPC, date = date });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult WhInventoryExcel()
        {
            try
            {
                var session = (Models.User)Session["user"];
                var getAllDetailWH = db.DetailWareHouses.ToList();
                var detailWH = getAllDetailWH
                .GroupBy(b => new { b.IdWareHouse, b.WareHouse.Name })
                .AsEnumerable()
                .Select((g, i) => new
                {
                    idwarehouse = g.Key.IdWareHouse,
                    namewarehouse = g.Key.Name,
                    count = g.Sum(item => item.Inventory),
                }).ToList();
                var date = DateTime.Now.ToString("dd-MM-yyyy");

                var fileName = rm.GetString("inventory");
                var filePath = Path.Combine(Path.GetTempPath(), fileName);

                using (ExcelPackage excelPackage = new ExcelPackage())
                {
                    // Tạo một worksheet mới
                    var worksheet = excelPackage.Workbook.Worksheets.Add(rm.GetString("inventory_overview"));

                    // Định dạng màu
                    var titleColor = System.Drawing.Color.FromArgb(0, 123, 255); // Màu xanh nước
                    var subtitleColor = System.Drawing.Color.FromArgb(85, 85, 85); // Màu xám nhạt
                    var headerColor = System.Drawing.Color.FromArgb(255, 255, 0); // Màu vàng

                    worksheet.Cells["A3:H3"].Merge = true;
                    worksheet.Cells["A3"].Value = rm.GetString("inventory_print");
                    worksheet.Cells["A3"].Style.Font.Bold = true;
                    worksheet.Cells["A3"].Style.Font.Size = 14;
                    worksheet.Cells["A3"].Style.Font.Color.SetColor(titleColor);
                    worksheet.Cells["A3"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                    // Thông tin chung
                    worksheet.Cells["A5"].Value = $"{rm.GetString("print_time")}: {DateTime.Now:dd-MM-yyyy}";
                    worksheet.Cells["A6"].Value = $"{rm.GetString("account_print")}: {session.Name}";

                    // Định nghĩa các nhóm header
                    var headers = new[]
                    {
                        new { Text = rm.GetString("inventory_name"), StartColumn = "A", EndColumn = "D" },
                        new { Text = rm.GetString("inventory_quantity"), StartColumn = "E", EndColumn = "H" }
                    };

                    // Áp dụng vòng lặp để merge và định dạng
                    int headerRow = 8; // Dòng chứa tiêu đề
                    foreach (var header in headers)
                    {
                        string mergeRange = $"{header.StartColumn}{headerRow}:{header.EndColumn}{headerRow}";
                        worksheet.Cells[mergeRange].Merge = true;
                        worksheet.Cells[mergeRange].Value = header.Text;
                        worksheet.Cells[mergeRange].Style.Font.Bold = true;
                        worksheet.Cells[mergeRange].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        worksheet.Cells[mergeRange].Style.Fill.BackgroundColor.SetColor(headerColor);
                        worksheet.Cells[mergeRange].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    }

                    // Dữ liệu
                    int rowIndex = 9;
                    foreach (var wh in detailWH)
                    {
                        // Tên kho hàng
                        string warehouseRange = $"A{rowIndex}:D{rowIndex}";
                        worksheet.Cells[warehouseRange].Merge = true;
                        worksheet.Cells[warehouseRange].Value = wh.namewarehouse;
                        worksheet.Cells[warehouseRange].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                        // Số lượng tồn
                        string countRange = $"E{rowIndex}:H{rowIndex}";
                        worksheet.Cells[countRange].Merge = true;
                        worksheet.Cells[countRange].Value = wh.count;
                        worksheet.Cells[countRange].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                        rowIndex++;

                        if (wh.count > 0)
                        {
                            var dWHItem = getAllDetailWH.Where(x => x.IdWareHouse == wh.idwarehouse).ToList();

                            // Tạo worksheet cho kho
                            var warehouseSheet = excelPackage.Workbook.Worksheets.Add(wh.namewarehouse);

                            // Tiêu đề
                            warehouseSheet.Cells["A1:C1"].Merge = true;
                            warehouseSheet.Cells["A1"].Value = $"{rm.GetString("inventory_data")}: {wh.namewarehouse}";
                            warehouseSheet.Cells["A1"].Style.Font.Bold = true;
                            warehouseSheet.Cells["A1"].Style.Font.Size = 14;
                            warehouseSheet.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

                            // Tiêu đề cột
                            var epcHeaders = new[] { rm.GetString("inventory_idgood"), rm.GetString("good_name"), rm.GetString("unit"), rm.GetString("quantity") };
                            for (int j = 0; j < epcHeaders.Length; j++)
                            {
                                warehouseSheet.Cells[3, j + 1].Value = epcHeaders[j];
                                warehouseSheet.Cells[3, j + 1].Style.Font.Bold = true;
                                warehouseSheet.Cells[3, j + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                                warehouseSheet.Cells[3, j + 1].Style.Fill.BackgroundColor.SetColor(headerColor);
                                warehouseSheet.Cells[3, j + 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                            }

                            // Dữ liệu EPC
                            int epcRowIndex = 4;
                            foreach (var item in dWHItem)
                            {
                                var product = db.Goods.Where(g => g.Id == item.IdGoods).Select(g => new
                                {
                                    g.Id,
                                    g.Name,
                                    Unit = g.Unit.Name,
                                }).FirstOrDefault();
                                warehouseSheet.Cells[epcRowIndex, 1].Value = product != null ? product.Id : rm.GetString("data_noexist");
                                warehouseSheet.Cells[epcRowIndex, 2].Value = product != null ? product.Name : "";
                                warehouseSheet.Cells[epcRowIndex, 3].Value = product != null ? product.Unit : "";
                                warehouseSheet.Cells[epcRowIndex, 4].Value = item.Inventory;
                                epcRowIndex++;
                            }

                            warehouseSheet.Column(1).AutoFit();
                            warehouseSheet.Column(2).AutoFit();
                            warehouseSheet.Column(3).AutoFit();
                            warehouseSheet.Column(4).AutoFit();
                        }
                    }

                    worksheet.Column(1).AutoFit();
                    worksheet.Column(2).AutoFit();
                    worksheet.View.FreezePanes(2, 1);

                    // Lấy file Excel dưới dạng byte array
                    var fileContent = excelPackage.GetAsByteArray();

                    return Json(new { code = 200, msg = rm.GetString("excel"), fileContent = Convert.ToBase64String(fileContent), fileName = fileName }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult WhInventoryPDF()
        {
            try
            {
                var session = (Models.User)Session["user"];
                var detailWH = db.DetailWareHouses
                .GroupBy(b => new { b.IdWareHouse, b.WareHouse.Name })
                .AsEnumerable()
                .Select((g, i) => new
                {
                    idwarehouse = g.Key.IdWareHouse,
                    namewarehouse = g.Key.Name,
                    count = g.Sum(item => item.Inventory),
                }).ToList();

                var listEPC = db.EPCs.Where(x => x.Status == true)
                                     .Select(x => new
                                     {
                                         x.IdGoods,
                                         Name = db.Goods.FirstOrDefault(g => g.Id == x.IdGoods).Name,
                                         x.IdWareHouse,
                                         x.IdEPC
                                     })
                                     .OrderBy(item => item.Name)
                                     .ToList();
                var date = DateTime.Now.ToString("dd-MM-yyyy");
                string tempFilePath = Path.Combine(Path.GetTempPath(), "Ton_Kho.pdf");

                string fontPath = Server.MapPath("~/fonts/tahoma.ttf");

                // Thiết lập mã hóa và mật khẩu cho file PDF
                var writerProperties = new WriterProperties()
                    .SetStandardEncryption(
                        null, // Người dùng không cần mật khẩu để mở PDF
                        Encoding.UTF8.GetBytes("password"), // Mật khẩu để hạn chế quyền
                        EncryptionConstants.ALLOW_PRINTING,
                        EncryptionConstants.ENCRYPTION_AES_128
                    );

                // Tạo file PDF và lưu vào thư mục tạm
                using (var pdfDocument = new PdfDocument(new PdfWriter(tempFilePath, writerProperties)))
                {
                    // Load font Tahoma từ file .ttf (font hỗ trợ tiếng Việt)
                    var font = PdfFontFactory.CreateFont(fontPath, PdfEncodings.IDENTITY_H);

                    var document = new Document(pdfDocument);

                    // Áp dụng font Tahoma cho toàn bộ văn bản trong tài liệu
                    document.SetFont(font);

                    var getHeaderPath = Server.MapPath("~/PrintDetail/DataBill.js"); // Đường dẫn tới file
                    if (System.IO.File.Exists(getHeaderPath))
                    {
                        // Đọc toàn bộ nội dung file
                        string jsContent = System.IO.File.ReadAllText(getHeaderPath);

                        // Lấy JSON từ biến trong file (nếu cần, bạn có thể dùng regex để trích xuất)
                        string jsonContent = jsContent.Replace("var dataBill =", "").Trim(';').Trim();

                        // Parse JSON thành Dictionary
                        var data = JsonConvert.DeserializeObject<Dictionary<string, string>>(jsonContent);

                        // Tiêu đề
                        document.Add(new Paragraph(data["header1"])
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(20)
                            .SetBold()
                            .SetFontColor(new DeviceRgb(0, 123, 255)));

                        document.Add(new Paragraph(data["header2"])
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(12)
                            .SetFontColor(new DeviceRgb(85, 85, 85)));
                    }
                    else
                    {
                        // Tiêu đề
                        document.Add(new Paragraph("CÔNG TY TNHH XYZ")
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(20)
                            .SetBold()
                            .SetFontColor(new DeviceRgb(0, 123, 255)));

                        document.Add(new Paragraph("Địa chỉ: 123 Đường ABC, TP. HCM")
                            .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                            .SetFontSize(12)
                            .SetFontColor(new DeviceRgb(85, 85, 85)));
                    }

                    document.Add(new Paragraph(rm.GetString("inventory_print"))
                        .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                        .SetFontSize(16)
                        .SetBold()
                        .SetFontColor(new DeviceRgb(0, 123, 255)));

                    document.Add(new Paragraph($"{rm.GetString("print_time")}: {DateTime.Now:dd-MM-yyyy}")
                        .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                        .SetFontSize(12));
                    // Tạo LineSeparator với màu xanh nước
                    var startLineSeparator = new LineSeparator(new SolidLine(1)).SetStrokeColor(new DeviceRgb(0, 123, 255));
                    document.Add(startLineSeparator);

                    // Thông tin chung
                    document.Add(new Paragraph($"{rm.GetString("account_print")}: {session.Name}")
                        .SetFontSize(12)
                        .SetBold()
                        .SetFontColor(new DeviceRgb(51, 51, 51)));

                    // Duyệt qua từng kho hàng
                    foreach (var warehouse in detailWH)
                    {
                        // Bảng thông tin tồn kho
                        var warehouseTable = new iText.Layout.Element.Table(UnitValue.CreatePercentArray(new float[] { 50, 50 }))
                            .UseAllAvailableWidth()
                            .SetMarginBottom(10);

                        warehouseTable.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("inventory_name")).SetBold()));
                        warehouseTable.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("inventory_quantity")).SetBold()));

                        warehouseTable.AddCell(new Cell().Add(new Paragraph(warehouse.namewarehouse)));
                        warehouseTable.AddCell(new Cell().Add(new Paragraph(warehouse.count.ToString())));

                        document.Add(warehouseTable);

                        // Bảng thông tin hàng hóa EPC
                        var goodsTable = new iText.Layout.Element.Table(UnitValue.CreatePercentArray(new float[] { 30, 40, 30 }))
                            .UseAllAvailableWidth()
                            .SetMarginBottom(20);

                        goodsTable.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("inventory_idgood")).SetBold()));
                        goodsTable.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("good_name")).SetBold()));
                        goodsTable.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("epc_code")).SetBold()));

                        var goodsInWarehouse = listEPC.Where(e => e.IdWareHouse == warehouse.idwarehouse).ToList();

                        if (goodsInWarehouse.Count > 0)
                        {
                            foreach (var goods in goodsInWarehouse)
                            {
                                goodsTable.AddCell(new Cell().Add(new Paragraph(goods.IdGoods)));
                                goodsTable.AddCell(new Cell().Add(new Paragraph(goods.Name)));
                                goodsTable.AddCell(new Cell().Add(new Paragraph(goods.IdEPC)));
                            }
                        }
                        else
                        {
                            goodsTable.AddCell(new Cell().Add(new Paragraph("")));
                            goodsTable.AddCell(new Cell().Add(new Paragraph("")));
                            goodsTable.AddCell(new Cell().Add(new Paragraph("")));
                        }

                        document.Add(goodsTable);

                        // Thêm một thanh ngang giữa các bảng
                        var lineSeparator = new LineSeparator(new SolidLine(1))
                            .SetMarginBottom(10);
                        document.Add(lineSeparator);
                    }

                    // Đóng tài liệu
                    document.Close();
                }

                //// Tạo một đối tượng PdfDocument
                //var pdfDocument = new PdfDocument(new PdfWriter(tempFilePath));
                //var document = new Document(pdfDocument);

                // Trả về file PDF cho người dùng tải về
                var filePath = "Tồn Kho";
                var fileBytes = System.IO.File.ReadAllBytes(tempFilePath);
                // Mã hóa fileBytes thành chuỗi Base64
                var fileBase64 = Convert.ToBase64String(fileBytes);

                // Xóa file sau khi đã đọc xong để giải phóng bộ nhớ
                System.IO.File.Delete(tempFilePath);

                return Json(new { code = 200, msg = rm.GetString("pdf"), fileContent = fileBase64, fileName = filePath }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message });
            }
        }

        public ActionResult SetupBarcodeStructure()
        {
            return View();
        }

        [HttpPost]
        public ActionResult SaveBarcodeStructure(string model,string oldSeperate)
        {
            try
            {
                var deserializeModel = JsonConvert.DeserializeObject<BarcodeStructureModel>(model);
                var pathLayoutLabel = Server.MapPath("~/Areas/WarehouseManagement/assets/js/Printing_Setup/layout_label.json");
                if (!System.IO.File.Exists(pathLayoutLabel))
                    return Json(new { code = 500, msg = rm.GetString("layout_label_not_exist") }, JsonRequestBehavior.AllowGet);
                // Đọc toàn bộ nội dung file .js
                string jsLayoutLabel = System.IO.File.ReadAllText(pathLayoutLabel);
                // Loại bỏ đoạn "var barcodeStructure = " và dấu `;`
                jsLayoutLabel = jsLayoutLabel.Trim().TrimEnd(';');
                var unwrappedJson = JsonConvert.DeserializeObject<string>(jsLayoutLabel);
                var getItems = JsonConvert.DeserializeObject<LabelData>(unwrappedJson);
                foreach(var component in getItems.Components)
                {
                    component.Fields = component.Fields.Replace(oldSeperate, deserializeModel.seperatorChar);
                }
                var fileName = "layout_label.json";
                var dirPath = Server.MapPath("~/Areas/WarehouseManagement/assets/js/Printing_Setup");
                if (!Directory.Exists(dirPath))
                {
                    Directory.CreateDirectory(dirPath);
                }

                var filePath = Path.Combine(dirPath, fileName);
                var dataToWrite = JsonConvert.SerializeObject(JsonConvert.SerializeObject(getItems, new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore,
                    Formatting = Formatting.None
                }));
                System.IO.File.WriteAllText(filePath, dataToWrite);

                // Convert model thành JS string
                var json = JsonConvert.SerializeObject(deserializeModel, Formatting.Indented);
                var jsContent = $"var barcodeStructure = {json};";

                // Tìm đường dẫn vật lý tới file trên server
                var path = Server.MapPath("~/Areas/WarehouseManagement/assets/js/Warehouse/BarcodeStructure.js");

                // Ghi nội dung vào file
                System.IO.File.WriteAllText(path, jsContent, Encoding.UTF8);
                return Json(new { code = 200, msg = rm.GetString("save_success") });
            }
            catch (Exception ex)
            {
                return Json(new { success = true, msg = "Error: " + ex.Message });

            }
        }

        [HttpGet]
        public JsonResult GetBarcodeStructure()
        {
            try
            {
                var pathStructure = Server.MapPath("~/Areas/WarehouseManagement/assets/js/Warehouse/BarcodeStructure.js");
                string jsContentStructure = System.IO.File.ReadAllText(pathStructure);
                // Loại bỏ đoạn "var barcodeStructure = " và dấu `;`
                string pattern = @"var\s+barcodeStructure\s*=\s*";
                string jsonPartStructure = Regex.Replace(jsContentStructure, pattern, "");
                jsonPartStructure = jsonPartStructure.Trim().TrimEnd(';');
                var barcodeStructure = JsonConvert.DeserializeObject<BarcodeStructureModel>(jsonPartStructure);
                return Json(new { code = 200, barcodeStructure }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = true, msg = "Error: " + ex.Message }, JsonRequestBehavior.AllowGet);

            }
        }
    }

    public class EightColumnExcel
    {
        public string C1 { get; set; }
        public string C2 { get; set; }
        public string C3 { get; set; }
        public string C4 { get; set; }
        public string C5 { get; set; }
        public string C6 { get; set; }
        public string C7 { get; set; }
        public string C8 { get; set; }
    }

    public class TransportationRequestDto
    {
        public string IdSO { get; set; }
        public string WarehouseID { get; set; }
        public int HandlingStatusID { get; set; }
        public string Note { get; set; }
        public List<GoodsDtoRequest> GoodsList { get; set; }

        public string ImportWarehouseID { get; set; }
    }

    public class ImportEPC
    {
        public string C1 { get; set; }
        public string C2 { get; set; }
    }

    public class BarcodeStructureModel
    {
        public bool isSeparate { get; set; }
        public string seperatorChar { get; set; }
        public List<BarcodeField> structure { get; set; }
    }

    public class BarcodeField
    {
        public string key { get; set; }
        public bool status { get; set; }
    }

    public class LabelData
    {
        public string Width_Label { get; set; }
        public string Height_Label { get; set; }
        public List<Component> Components { get; set; }
    }

    public class Component
    {
        public string Type { get; set; }
        public double Left { get; set; }
        public double Top { get; set; }
        public string Mode { get; set; }
        public string Fields { get; set; }
        public string Value { get; set; }
        public int? Size { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public string Rotation { get; set; }
        public string ShowText { get; set; }
    }
}