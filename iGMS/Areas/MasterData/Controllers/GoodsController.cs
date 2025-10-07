using Newtonsoft.Json;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Net;
using System.Resources;
using System.Web;
using System.Web.Mvc;
using System.Web.UI.WebControls;
using WMS.Models;
using WMS.Controllers;
using static WMS.Models.DataForm;
using iText.IO.Font;
using iText.Kernel.Colors;
using iText.Kernel.Font;
using iText.Kernel.Pdf;
using iText.Layout.Element;
using iText.Layout.Properties;
using OfficeOpenXml.Style;
using System.Text;
using iText.Layout;
using iText.Kernel.Pdf.Canvas.Draw;
using iText.StyledXmlParser.Jsoup.Safety;
using System.Globalization;
using Microsoft.SqlServer.Management.XEvent;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;
using System.Text.RegularExpressions;

namespace WMS.Areas.MasterData.Controllers
{
    public class GoodsController : BaseController
    {
        private WMSEntities db = new WMSEntities();
        private ResourceManager rm = new ResourceManager("WMS.App_GlobalResources.Resource", typeof(Resources.Resource).Assembly);

        // GET: Goods
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Adds()
        {
            return View();
        }

        public ActionResult DetailList()
        {
            return View();
        }

        public ActionResult SearchEPC()
        {
            return View();
        }

        public ActionResult Edits(string id)
        {
            if (id.Length <= 0)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Good good = db.Goods.Find(id);
            if (good == null)
            {
                return HttpNotFound();
            }
            ViewBag.idUnit = good.IdUnit == null ? "-1" : good.IdUnit;
            ViewBag.nameUnit = good.IdUnit == null ? rm.GetString("Thuộc Đơn Vị").ToString() : good.Unit.Name;
            ViewBag.idGroupGoods = good.IdGroupGood == null ? "-1" : good.IdGroupGood;
            ViewBag.nameGroupGoods = good.IdGroupGood == null ? rm.GetString("Thuộc Nhóm Hàng").ToString() : good.GroupGood.Name;
            ViewBag.reference = good.Identifier != null ? good.Identifier : "";
            return View(good);  
        }
        [HttpGet]
        public JsonResult ListNameGoods()
        {
            try
            {
                db.Configuration.ProxyCreationEnabled = false;
                var data = db.Goods.Select(x => x.Name).ToList();

                return Json(new { code = 200, data }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("false") + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        public ActionResult Details(string id)
        {
            if (id.Length <= 0)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Good good = db.Goods.Find(id);
            if (good == null)
            {
                return HttpNotFound();
            }
            return View(good);
        }

        [HttpPost]
        public JsonResult List(pagination pagination, Sort sort, DataForm.query query)
        {
            try
            {
                ////var search = query == null ? "" : (query.generalSearch == null ? "" : query.generalSearch);
                //if (sort.field == "STT")
                //{
                //    sort.field = "Id";
                //}
                if (query == null)
                {
                    query = new DataForm.query();
                }
                var sortField = sort == null ? "Id" : (sort.field == null ? "Id" : sort.field);
                //if (sortField == "STT")
                //{
                //    sortField = "Id";

                if (query.idpurchase == null)
                {
                    query.idpurchase = "";
                }
                else
                {
                    query.idpurchase = query.idpurchase.ToLower().Trim();
                }
                    var querys = db.Goods.Where(x => (x.Id.ToLower().Contains(query.idpurchase)) || (x.Name.ToLower().Contains(query.idpurchase)) || (x.Description != null && x.Description.ToLower().Contains(query.idpurchase)) || (x.Identifier != null && x.Identifier.ToLower().Contains(query.idpurchase))).AsQueryable();

                if (query.staff == null)
                    query.staff = "";
                if (query.warehouse == null)
                    query.warehouse = "";
                if (query.idreceipt == null)
                    query.idreceipt = "";
                if (query.unit == null)
                    query.unit = "";
                DateTime sDate;
                DateTime eDate;

                if (!DateTime.TryParseExact(query.s, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out sDate))
                {
                    sDate = new DateTime(1900, 12, 12);
                }

                if (!DateTime.TryParseExact(query.e, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out eDate))
                {
                    eDate = new DateTime(3000, 12, 12);
                }
                else
                {
                    eDate = eDate.AddDays(1).AddTicks(-1);
                }


                var unitDictionary = db.Units.ToDictionary(x => x.Id, x => x.Name);
                var groupGoodsDictionary = db.GroupGoods.ToDictionary(x => x.Id, x => x.Name);

                var filtered = querys.Where(x => !x.Id.Contains("J")).ToList().Select((u, index) => new
                                                    {
                                                        u.Id,
                                                        u.Name,
                                                        u.Description,
                                                        GroupGood = u.IdGroupGood != null ? groupGoodsDictionary[u.IdGroupGood] : "",
                                                        Warehouse = string.Join(", ", db.DetailWareHouses
                                                                                .Where(x => x.IdGoods == u.Id && x.Inventory >= 1)
                                                                                .Select(x => x.WareHouse.Name)),
                                                        u.Inventory,
                                                        IdUnit = u.IdUnit != null ? unitDictionary[u.IdUnit] : "",
                                                        CreateDate = u.CreateDate,
                                                        ModifyDate = u.ModifyDate?.ToString("dd/MM/yyyy") ?? string.Empty,
                                                        u.CreateBy,
                                                        u.ModifyBy,
                                                        Status = u.Status,
                                                        u.Identifier,
                                                    }).Where(x => (x.CreateBy.Contains(query.staff) && x.GroupGood.Contains(query.idreceipt) && x.IdUnit.Contains(query.unit) && x.Warehouse.Contains(query.warehouse) && x.CreateDate <= eDate && x.CreateDate >= sDate));
                    

                var result = filtered
                            .Select((u, index) => new
                            {
                                u.Id,
                                u.Name,
                                u.Description,
                                u.GroupGood,
                                u.Warehouse,
                                u.Inventory,
                                u.IdUnit,
                                u.CreateDate,
                                u.ModifyDate,
                                u.CreateBy,
                                u.ModifyBy,
                                Status = u.Status,
                                u.Identifier,
                                STT = index + 1
                            })
                            .ToList().AsQueryable();

                result = (sort.sort == "desc")
                        ? result.OrderBy($"{sortField} DESC")
                        : result.OrderBy($"{sortField} ASC");
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
                return Json(new { code = 200, data, meta });
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("false") + e.Message });
            }
        }

        [HttpPost]
        public JsonResult Add(Good good, string arrayepc)
        {
            try
            {
                
                db.Configuration.ProxyCreationEnabled = false;
                var session = (User)Session["user"];
                var nameAdmin = session.Name;

                //---Ha
                var epcs = JsonConvert.DeserializeObject<string[]>(arrayepc);
                if (string.IsNullOrEmpty(good.Id))
                {
                    return Json(new { status = 500, msg = rm.GetString("nhập mã hàng").ToString() }, JsonRequestBehavior.AllowGet);
                }
                if (!Regex.IsMatch(good.Id, @"^[a-zA-Z0-9_-]+$"))
                {
                    return Json(new { status = 500, msg = rm.GetString("product_code_standard").ToString() }, JsonRequestBehavior.AllowGet);
                }
                //if (!Regex.IsMatch(good.Id, @"^[^\s@#\$%\^&\*\(\)\+\=\{\}\[\]\|\\:;""'<>,\./\?`~]*$"))
                //{
                //    return Json(new { status = 500, msg = rm.GetString("product_code_standard").ToString() }, JsonRequestBehavior.AllowGet);
                //}
                if (string.IsNullOrEmpty(good.Name))
                {
                    return Json(new { status = 500, msg = rm.GetString("nhập tên hàng".ToString()) }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    var checkGoodsID = db.Goods.Find(good.Id);
                    var checkGoodsIdentifier = db.Goods.FirstOrDefault(x => x.Identifier != null && x.Identifier == good.Identifier);
                    if (checkGoodsID != null)
                    {
                        return Json(new { status = 500, msg = rm.GetString("mã hàng tồn tại").ToString() + " " + good.Id }, JsonRequestBehavior.AllowGet);
                    }
                    if (checkGoodsIdentifier != null)
                    {
                        return Json(new { status = 500, msg = rm.GetString("sku_identifier_exists").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    if (good.IdGroupGood == "-1")
                    {
                        good.IdGroupGood = null;
                    }
                    if (good.IdUnit == "-1")
                    {
                        good.IdUnit = null;
                    }
                    good.CreateDate = DateTime.Now;
                    good.ModifyDate = DateTime.Now;
                    good.CreateBy = session.Name;
                    good.ModifyBy = session.Name;
                    good.Inventory = 0;
                    //good.IdWareHouse = idDetailWarehouse;

                    db.Goods.Add(good);
                    var getAllWarehouse = db.WareHouses.ToList();
                    foreach (var item in getAllWarehouse)
                    {
                        var newDetail = new DetailWareHouse
                        {
                            IdWareHouse = item.Id,
                            IdGoods = good.Id,
                            Inventory = 0,
                            Status = true
                        };
                        db.DetailWareHouses.Add(newDetail);
                    }
                    //List<EPC> list = new List<EPC>();
                    //foreach (var item in epcs)
                    //{
                    //    list.Add(new EPC
                    //    {
                    //        IdGoods = good.Id,
                    //        IdEPC = item,
                    //        IdWareHouse = idDetailWarehouse,
                    //        Status = true
                    //    });
                    //}
                    //db.EPCs.AddRange(list);
                    db.SaveChanges();

                    return Json(new { status = 200, msg = rm.GetString("CreateSucess") }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { status = 500, msg = rm.GetString("FailCreate") + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult showtbd(string id)
        {
            try
            {
                db.Configuration.ProxyCreationEnabled = false;
                var session = (User)Session["user"];
                var editG = db.Goods.Find(id);
                var detailTbd = db.DetailWareHouses.FirstOrDefault(x => x.IdGoods == id);
                var e = (from b in db.Goods
                         join d in db.DetailWareHouses on b.Id equals d.IdGoods
                         where b.Id == id
                         select new
                         {
                             id = b.Id,
                             name = b.Name,
                             wareHouse = d.WareHouse.Name,
                             d.IdWareHouse,
                             inventory = d.Inventory,
                         }).ToList();

                return Json(new { code = 200, e }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("false") + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult Edit(Good good)
        {
            try
            {
                db.Configuration.ProxyCreationEnabled = false;
                var session = (User)Session["user"];
                if (string.IsNullOrEmpty(good.Name))
                {
                    return Json(new { status = 500, msg = rm.GetString("nhập tên hàng".ToString()) });
                }
                if (string.IsNullOrEmpty(good.Id))
                {
                    return Json(new { status = 500, msg = rm.GetString("nhập mã hàng").ToString() });
                }
                
                var editG = db.Goods.Find(good.Id);
                var checkGoodsIdentifier = db.Goods.FirstOrDefault(x => x.Identifier != null && x.Identifier == good.Identifier && x.Identifier != editG.Identifier);
                if (checkGoodsIdentifier != null)
                {
                    return Json(new { status = 500, msg = rm.GetString("sku_identifier_exists").ToString() }, JsonRequestBehavior.AllowGet);
                }
                if (good.IdGroupGood == "-1")
                {
                    editG.IdGroupGood = null;
                }
                else
                {
                    editG.IdGroupGood = good.IdGroupGood;
                }
                if (good.IdUnit == "-1")
                {
                    editG.IdUnit = null;
                }
                else
                {
                    editG.IdUnit = good.IdUnit;
                }
                editG.Name = good.Name;
                editG.Description = good.Description;
                editG.Identifier = good.Identifier;
                editG.ModifyDate = DateTime.Now;
                editG.ModifyBy = session.Name;
                db.SaveChanges();
                return Json(new { code = 200, msg = rm.GetString("SucessEdit") }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("FailEdit") + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult Delete(string id)
        {
            db.Configuration.ProxyCreationEnabled = false;
            var session = (User)Session["user"];
            try
            {
                var detailGoodOrder = db.DetailGoodOrders.Where(x => x.IdGoods == id).ToList();
                db.DetailGoodOrders.RemoveRange(detailGoodOrder);
                var detailDelivery = db.DetailDeliveries.Where(x => x.IdGood == id).ToList();
                db.DetailDeliveries.RemoveRange(detailDelivery);
                var detailSalesOrder = db.DetailSaleOrders.Where(x => x.IdGoods == id).ToList();
                db.DetailSaleOrders.RemoveRange(detailSalesOrder);
                var detailStock = db.DetailStocks.Where(x => x.IdGoods == id).ToList();
                db.DetailStocks.RemoveRange(detailStock);
                var detailReicept = db.DetailReceipts.Where(x => x.IdGood == id).ToList();
                db.DetailReceipts.RemoveRange(detailReicept);
                var epcs = db.EPCs.Where(x => x.IdGoods == id);
                var stockEpcs = new List<DetailStockEpc>();
                foreach (var item in epcs)
                {
                    var getList = db.DetailStockEpcs.Where(x => x.IdEpc == item.IdEPC).ToList();
                    stockEpcs.AddRange(getList);
                }
                db.DetailStockEpcs.RemoveRange(stockEpcs);
                db.EPCs.RemoveRange(epcs);
                var detailWarehouses = db.DetailWareHouses.Where(x => x.IdGoods == id);
                db.DetailWareHouses.RemoveRange(detailWarehouses);
                var d = db.Goods.Find(id);
                db.Goods.Remove(d);
                db.SaveChanges();

                return Json(new { code = 200, msg = rm.GetString("SucessDelete") }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception)
            {
                return Json(new { code = 500, msg = rm.GetString("FailDelete") }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult Detail(string id)
        {
            try
            {
                db.Configuration.ProxyCreationEnabled = false;
                if (!string.IsNullOrEmpty(id))
                {
                    var goods = (from g in db.Goods
                                 where g.Id == id
                                 select new
                                 {
                                     g.Id,
                                     g.Name,
                                     g.Description,
                                     g.IdUnit,
                                     g.IdGroupGood,
                                     g.Identifier,
                                     nameGroupGoods = g.GroupGood.Name == null ? "" : g.GroupGood.Name,
                                     nameUnit = g.Unit.Name == null ? "" : g.Unit.Name,
                                 }).ToList().LastOrDefault();

                    if (goods == null)
                    {
                        return Json(new { code = 500, msg = rm.GetString("mã hàng không tồn tại").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { code = 200, goods }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("mã hàng không tồn tại").ToString() }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception)
            {
                return Json(new { code = 500, msg = rm.GetString("error") }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GroupGoods()
        {
            try
            {
                var c = (from b in db.GroupGoods.Where(x => x.Id.Length > 0)
                         select new
                         {
                             id = b.Id,
                             name = b.Name
                         }).ToList();
                return Json(new { code = 200, c = c, }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("false") + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult WareHouse()
        {
            try
            {
                var c = (from b in db.WareHouses.Where(x => x.Id.Length > 0)
                         select new
                         {
                             id = b.Id,
                             name = b.Name
                         }).ToList();
                return Json(new { code = 200, c = c, }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("false") + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult Upload(HttpPostedFileBase file)
        {
            try
            {
                var session = (User)Session["user"];
                var nameAdmin = session.Name;
                if (file.ContentLength != 0)
                {
                    if ((file != null) && (file.ContentLength > 0) && !string.IsNullOrEmpty(file.FileName))
                    {
                        string fileExtension = Path.GetExtension(file.FileName).ToLower();
                        if (fileExtension != ".xlsx" && fileExtension != ".xls")
                        {
                            // Xử lý file không hợp lệ
                            return Json(new { status = 500, msg = rm.GetString("excel_miss") }, JsonRequestBehavior.AllowGet);
                        }
                        string fileName = file.FileName;
                        string fileContentType = file.ContentType;
                        byte[] fileBytes = new byte[file.ContentLength];
                        var data = file.InputStream.Read(fileBytes, 0, Convert.ToInt32(file.ContentLength));
                        using (var package = new ExcelPackage(file.InputStream))
                        {
                            List<Good> goodList = new List<Good>();
                            foreach (var worksheet in package.Workbook.Worksheets)
                            {
                                ExcelWorksheet currentSheet = worksheet;
                                var workSheet = currentSheet;
                                var noOfCol = workSheet.Dimension.End.Column;
                                var noOfRow = workSheet.Dimension.End.Row;
                                List<DetailWareHouse> detailWareHouseList = new List<DetailWareHouse>();
                                List<EPC> epcList = new List<EPC>();

                                if (!workSheet.Cells[1, 1].Value.Equals(rm.GetString("good_id")) || !workSheet.Cells[1, 2].Value.Equals(rm.GetString("good_name")) || !workSheet.Cells[1, 3].Value.Equals(rm.GetString("production_date")) || !workSheet.Cells[1, 4].Value.Equals(rm.GetString("inventory")) || !workSheet.Cells[1, 5].Value.Equals(rm.GetString("good_group")) || !workSheet.Cells[1, 6].Value.Equals(rm.GetString("unit")) || !workSheet.Cells[1, 7].Value.Equals(rm.GetString("description")) )
                                {
                                    return Json(new { status = 500, msg = rm.GetString("excel_not_correct_format") });
                                }

                                for (int rowIterator = 2; rowIterator <= noOfRow; rowIterator++)
                                {
                                    var idGoods = workSheet.Cells[rowIterator, 1]?.Value?.ToString().Trim();
                                    var Name = workSheet.Cells[rowIterator, 2].Value?.ToString().Trim();
                                    var Date = workSheet.Cells[rowIterator, 3].Value?.ToString().Trim() != null ? DateTime.ParseExact(RemoveDaySuffix(workSheet.Cells[rowIterator, 3].Value?.ToString().Trim()), "MMMM d, yyyy", CultureInfo.InvariantCulture) : DateTime.Now;
                                    var Quantity = workSheet.Cells[rowIterator, 4]?.Value == null ? "0" : workSheet.Cells[rowIterator, 4]?.Value.ToString().Trim() ;
                                    var GroupGood = workSheet.Cells[rowIterator, 5]?.Value == null ? "-1" : workSheet.Cells[rowIterator, 5].Value.ToString().Trim();
                                    var Unit = workSheet.Cells[rowIterator, 6]?.Value == null ? "-1" : workSheet.Cells[rowIterator, 6].Value.ToString().Trim();
                                    var Des = workSheet.Cells[rowIterator, 7].Value?.ToString().Trim();
                                    var checkId = goodList.SingleOrDefault(x => x.Id == idGoods);
                                    var checkUnit = db.Units.FirstOrDefault(x => x.Name.ToLower().Trim() == Unit.ToLower());
                                    var getIDUnit = false;
                                    var getIDGroupGood = false;
                                    if (string.IsNullOrEmpty(idGoods))
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("goods_id_line")} {rowIterator} {rm.GetString("is_not_empty")} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                    }
                                    string pattern = @"^[a-zA-Z0-9_-]+$";
                                    if (!Regex.IsMatch(idGoods, pattern))
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("product_code_standard")} {rm.GetString("atline")} {rowIterator} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (string.IsNullOrEmpty(Name))
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("goods_line")} {rowIterator} {rm.GetString("is_not_empty")} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                    }
                                    bool isValidQty = double.TryParse(Quantity, out double result);
                                    if (!isValidQty)
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("goods_quantity_line")} {rowIterator} {rm.GetString("not_valid_number")} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                    }
                                    var checkGroupGood = db.GroupGoods.FirstOrDefault(x => x.Name.ToLower().Trim() == GroupGood.ToLower());
                                    var checkExistInDb = db.Goods.FirstOrDefault(g => g.Id == idGoods);
                                    if (checkExistInDb != null)
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("goods_id_line")} {rowIterator} {rm.GetString("already_exists")} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                    }
                                    if (checkUnit == null && Unit != "-1")
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("unit_line")} {rowIterator} {rm.GetString("not_in_system")} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                    }
                                    else
                                    {
                                        if (Unit != "-1")
                                        {
                                            getIDUnit = true;
                                        }
                                    }
                                    if (checkGroupGood == null && GroupGood != "-1")
                                    {
                                        return Json(new { status = 500, msg = $"{rm.GetString("goodgroup_line")} {rowIterator} {rm.GetString("not_in_system")} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                    }
                                    else
                                    {
                                        if (GroupGood != "-1")
                                        {
                                            getIDGroupGood = true;
                                        }

                                    }

                                    if (checkId == null)
                                    {
                                        Good good = new Good()
                                        {
                                            Id = idGoods,
                                            Name = Name,
                                            CreateDate = Date,
                                            ModifyDate = DateTime.Now,
                                            CreateBy = session.Name,
                                            ModifyBy = session.Name,
                                            Line = rowIterator,
                                            Inventory = double.Parse(Quantity),
                                        };
                                        if (getIDUnit)
                                        {
                                            good.IdUnit = checkUnit.Id;
                                        }
                                        if (getIDGroupGood)
                                        {
                                            good.IdGroupGood = checkGroupGood.Id;
                                        }
                                        goodList.Add(good);
                                    }
                                    else
                                    {
                                        checkId.Inventory += double.Parse(Quantity);
                                        if (checkId.IdUnit != null && checkId.IdUnit != checkUnit.Id)
                                        {
                                            return Json(new { status = 500, msg = $"{rm.GetString("unit_line")} {rowIterator} {rm.GetString("different_line")} {checkId.Line} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                        }
                                        if (checkId.IdGroupGood != null && checkId.IdGroupGood != checkGroupGood.Id)
                                        {
                                            return Json(new { status = 500, msg = $"{rm.GetString("goodgroup_line")} {rowIterator} {rm.GetString("different_line")} {checkId.Line} {rm.GetString("in_sheet")} {worksheet.Name}!" }, JsonRequestBehavior.AllowGet);
                                        }
                                        if (checkId.Name != Name)
                                        {
                                            return Json(new { status = 500, msg = $"{rm.GetString("goods_line")} {rowIterator} {rm.GetString("different_line")} {checkId.Line} {rm.GetString("in_sheet")} {worksheet.Name}" }, JsonRequestBehavior.AllowGet);
                                        }
                                    }
                                }
                            }
                            
                            foreach (var item in goodList)
                            {
                                //var idDetailWH = "V2FyZWhvdXNlIEE2025623145338371";
                                var reponse = AddUpload(item);
                                var stringReponse = JsonConvert.SerializeObject(reponse.Data);
                                var jsonReponse = JsonConvert.DeserializeObject<reponses>(stringReponse);
                                if (jsonReponse.status == 500)
                                {
                                    return Json(new { status = 500, msg = rm.GetString("error") + ": " + jsonReponse.msg + "!" }, JsonRequestBehavior.AllowGet);
                                }
                            }
                        }
                    }
                }
                else
                {
                    return Json(new { status = 500, msg = rm.GetString("no_file_selected") }, JsonRequestBehavior.AllowGet);
                }

                return Json(new { status = 200, msg = rm.GetString("upload_success") }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = 500, msg = rm.GetString("error") + ": " + e.Message + "!" }, JsonRequestBehavior.AllowGet);
            }
        }

        public string RemoveDaySuffix(string dateStr)
        {
            // Dùng regex để xóa các hậu tố ngày (th, st, nd, rd)
            return System.Text.RegularExpressions.Regex.Replace(dateStr, @"(\d{1,2})(st|nd|rd|th)", "$1");
        }

        [HttpPost]
        public JsonResult AddUpload(Good good)
        {
            try
            {
                db.Configuration.ProxyCreationEnabled = false;
                var session = (User)Session["user"];
                var nameAdmin = session.Name;
                if (string.IsNullOrEmpty(good.Id))
                {
                    return Json(new { status = 500, msg = rm.GetString("nhập mã hàng").ToString() }, JsonRequestBehavior.AllowGet);
                }
                if (string.IsNullOrEmpty(good.Name))
                {
                    return Json(new { status = 500, msg = rm.GetString("nhập tên hàng".ToString()) }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    var checkGoodsID = db.Goods.Find(good.Id);
                    var checkGoodsIdentifier = db.Goods.FirstOrDefault(x => x.Identifier != null && x.Identifier == good.Identifier);
                    if (checkGoodsID != null)
                    {
                        return Json(new { status = 500, msg = rm.GetString("mã hàng tồn tại").ToString() + " " + good.Id }, JsonRequestBehavior.AllowGet);
                    }
                    if (checkGoodsIdentifier != null)
                    {
                        return Json(new { status = 500, msg = rm.GetString("sku_identifier_exists").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    if (good.IdGroupGood == "-1")
                    {
                        good.IdGroupGood = null;
                    }
                    if (good.IdUnit == "-1")
                    {
                        good.IdUnit = null;
                    }
                    //good.CreateDate = DateTime.Now;
                    //good.ModifyDate = DateTime.Now;
                    //good.CreateBy = session.Name;
                    //good.ModifyBy = session.Name;
                    //good.IdWareHouse = idDetailWarehouse;

                    db.Goods.Add(good);
                    var warehouse = db.WareHouses.FirstOrDefault();
                    // lưu thông tin vào detail warehouse
                    if (warehouse != null)
                    {
                        var newDetail = new DetailWareHouse
                        {
                            IdWareHouse = warehouse.Id,
                            IdGoods = good.Id,
                            Inventory = good.Inventory,
                            Status = true
                        };
                        db.DetailWareHouses.Add(newDetail);
                    }

                    var getAllWarehouse = db.WareHouses.Where(x => x.Id != warehouse.Id).ToList();
                    foreach (var item in getAllWarehouse)
                    {
                        var newDetail = new DetailWareHouse
                        {
                            IdWareHouse = item.Id,
                            IdGoods = good.Id,
                            Inventory = 0,
                            Status = true
                        };
                        db.DetailWareHouses.Add(newDetail);
                    }
                    //List<EPC> list = new List<EPC>();
                    //foreach (var item in epcs)
                    //{
                    //    list.Add(new EPC
                    //    {
                    //        IdGoods = good.Id,
                    //        IdEPC = item,
                    //        IdWareHouse = idDetailWarehouse,
                    //        Status = true
                    //    });
                    //}
                    //db.EPCs.AddRange(list);
                    db.SaveChanges();

                    return Json(new { status = 200, msg = rm.GetString("CreateSucess") }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { status = 500, msg = rm.GetString("FailCreate") + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult DownloadExampleFile()
        {
            //// Đường dẫn vật lý tới file
            //var filePath = Server.MapPath("~/Upload/Sample_Add_Goods.xlsx");

            //// Kiểm tra xem file có tồn tại không
            //if (!System.IO.File.Exists(filePath))
            //{
            //    return HttpNotFound();
            //}
            try
            {
                using (ExcelPackage excelPackage = new ExcelPackage())
                {
                    // Tạo một worksheet mới
                    var worksheet = excelPackage.Workbook.Worksheets.Add(rm.GetString("goods_data"));

                    // Định dạng màu
                    var titleColor = System.Drawing.Color.FromArgb(0, 123, 255); // Màu xanh nước
                    var subtitleColor = System.Drawing.Color.FromArgb(85, 85, 85); // Màu xám nhạt
                    var headerColor = System.Drawing.Color.FromArgb(255, 255, 0); // Màu vàng



                    // Tiêu đề cột
                    var headers = new[] { rm.GetString("good_id"), rm.GetString("good_name"), rm.GetString("production_date"), rm.GetString("inventory"), rm.GetString("good_group"), rm.GetString("unit"), rm.GetString("description") };
                    for (int i = 0; i < headers.Length; i++)
                    {
                        worksheet.Cells[1, i + 1].Value = headers[i];
                        worksheet.Cells[1, i + 1].Style.Font.Bold = true;
                        worksheet.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                        worksheet.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(headerColor);
                        worksheet.Cells[1, i + 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    }

                    // Dữ liệu mẫu
                    worksheet.Cells[2, 1].Value = rm.GetString("enter_product_code_excel");
                    worksheet.Cells[2, 2].Value = rm.GetString("enter_product_name_excel");
                    worksheet.Cells[2, 3].Value = rm.GetString("enter_production_date_excel");
                    worksheet.Cells[2, 4].Value = rm.GetString("enter_product_quantity_excel");
                    worksheet.Cells[2, 5].Value = rm.GetString("enter_product_group_excel");
                    worksheet.Cells[2, 6].Value = rm.GetString("enter_unit_excel");
                    worksheet.Cells[2, 7].Value = rm.GetString("enter_notes_excel");

                    // Định dạng
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Top.Style = ExcelBorderStyle.Thin;
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Left.Style = ExcelBorderStyle.Thin;
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Right.Style = ExcelBorderStyle.Thin;
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;

                    worksheet.Column(1).AutoFit();
                    worksheet.Column(2).AutoFit();
                    worksheet.Column(3).AutoFit();
                    worksheet.Column(4).AutoFit();
                    worksheet.Column(5).AutoFit();
                    worksheet.Column(6).AutoFit();
                    worksheet.Column(7).AutoFit();
                    worksheet.Column(8).AutoFit();
                    worksheet.View.FreezePanes(2, 1);
                    var fileName = rm.GetString("product_template");

                    // Lấy file Excel dưới dạng byte array
                    var fileContent = excelPackage.GetAsByteArray();


                    return Json(new { code = 200, msg = rm.GetString("sample_download_success"), fileContent = Convert.ToBase64String(fileContent), fileName = fileName }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult GetDetailListGood()
        {
            try
            {
                //var unitDictionary = db.Units.ToDictionary(x => x.Id, x => x.Name);
                //var groupGoodDictionary = db.GroupGoods.ToDictionary(x => x.Id, x => x.Name);
                var data = db.Goods
                .AsEnumerable()
                .Select((g, i) => new
                {
                    STT = i + 1,
                    Id = g.Id,
                    Unit = g.IdUnit != null ? g.Unit.Name : "",
                    GroupGood = g.IdGroupGood != null ? g.GroupGood.Name : "",
                    Name = g.Name,
                    Inventory = g.Inventory,
                    CreateDate = g.CreateDate,
                    CreateBy = g.CreateBy,
                }).ToList();

                return Json(new { code = 200, data });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message + "!" });
            }
        }

        [HttpPost]
        public JsonResult GetGoodEPCS(string id)
        {
            try
            {
                var data = db.EPCs.Where(x => x.IdGoods == id && x.Status == true)
                                  .AsEnumerable()
                                  .Select((e, i) => new
                                  {
                                      STT = i + 1,
                                      IdGood = e.IdGoods,
                                      EPC = e.IdEPC,
                                      NameWH = e.WareHouse.Name,
                                      IdSerial = e.IdSerial,
                                      NameGood = db.Goods.FirstOrDefault(x => x.Id == e.IdGoods).Name
                                  })
                                  .ToList();
                return Json(new { code = 200, data });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message + "!" });
            }
        }

        public class reponses
        {
            public string msg { get; set; }
            public int status { get; set; }
        }

        [HttpGet]
        public JsonResult DetailListGoods(int pagenum, int page, string idgoods)
        {
            try
            {
                var pageSize = pagenum;
                var epc = (from p in db.EPCs
                           where p.IdGoods == idgoods && p.Status == true
                           select new
                           {
                               idGoods = p.IdGoods,
                               idEPC = p.IdEPC,
                           }).ToList();
                var pages = epc.Count() % pageSize == 0 ? epc.Count() / pageSize : epc.Count() / pageSize + 1;
                var c = epc.Skip((page - 1) * pageSize).Take(pageSize).ToList();
                var count = epc.Count();
                return Json(new { code = 200, epc, pages = pages, count = count }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message + "!" }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult InventoryCheck(int page, int pageSize)
        {
            try
            {
                var user = (User)Session["user"];
                var username = user.User1;
                // hiển thị số lượng thông tin có trạng thái là true
                //var numNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username).Count();

                // sắp xếp thông tin mới nhất lên đầu danh sách thông báo
                var updatedNotify = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods != null)
                                    .OrderBy(n => n.Goods).Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                    .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                    .ToList();

                var numNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username && x.IdGoods != null).Count();

                var countTotal = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods != null).ToList().Count();

                return Json(new { code = 200, updatedNotify, countTotal, numNotify }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message + "!" }, JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult ShowListSearchGood()
        {
            var warehouse = db.WareHouses.ToList();

            // Gán giá trị vào ViewBag để sử dụng trong view
            ViewBag.WareHouses = warehouse;

            return View();
        }

        [HttpPost]
        public JsonResult GetListSearchGood(DataForm.pagination pagination, DataForm.Sort sort, query query)
        {
            try
            {
                if (query == null)
                {
                    query = new query();
                }
                if (query.WarehouseName == null)
                {
                    query.WarehouseName = "";
                }

                var search = query == null ? "" : (query.generalSearch == null ? "" : query.generalSearch);
                if (sort.field == "STT")
                {
                    sort.field = "Id";
                }
                var sortField = sort == null ? "Id" : (sort.field == null ? "Id" : sort.field);

                var goodName = db.Goods.ToDictionary(x => x.Id, x => x.Name);
                var goodGroupId = db.Goods.ToDictionary(x => x.Id, x => x.IdGroupGood);
                var goodUnitId = db.Goods.ToDictionary(x => x.Id, x => x.IdUnit);
                var groupGoodName = db.GroupGoods.ToDictionary(x => x.Id, x => x.Name);
                var unitName = db.Units.ToDictionary(x => x.Id, x => x.Name);
                var warehouseName = db.WareHouses.ToDictionary(x => x.Id, x => x.Name);
                var querys = db.EPCs.OrderBy(sortField == "GoodId" ? "IdGoods" : sortField);
                if (sort.sort == "desc")
                {
                    querys = db.EPCs.OrderBy($"{sortField} DESC");
                }
                var datas = querys.Where(x => x.SearchStatus == true).ToList()
                            .Select((u, index) => new
                            {
                                STT = index + 1,
                                GoodId = u.IdGoods,
                                GoodName = goodName[u.IdGoods],
                                EPC = u.IdEPC,
                                GroupGood = groupGoodName[goodGroupId[u.IdGoods]],
                                Warehouse = warehouseName[u.IdWareHouse],
                                IdUnit = unitName[goodUnitId[u.IdGoods]],
                                Status = u.Status,
                            })
                            .ToList().Where(x => x.GoodId.Contains(search) || x.GoodName.Contains(search)).Where(x => x.Warehouse.Contains(query.WarehouseName));
                var data = datas.Skip((pagination.page - 1) * pagination.perpage).Take(pagination.perpage).ToList();
                var pages = (int)Math.Ceiling((double)datas.Count() / pagination.perpage);
                var total = datas.Count();
                var meta = new
                {
                    page = pagination.page,
                    pages = pages,
                    perpage = pagination.perpage,
                    total = total,
                    sort = sort.sort,
                    field = sort.field
                };
                return Json(new { code = 200, data, meta });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message + "!" });
            }
        }

        [HttpPost]
        public JsonResult CheckIdGoodInSystem(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return Json(new { code = 500, msg = rm.GetString("goods_invalid") });
                }

                var check = db.Goods.FirstOrDefault(x => x.Id == id);
                if (check != null)
                {
                    return Json(new { code = 500, msg = rm.GetString("goods_exist") });
                }

                return Json(new { code = 200 });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message + "!" });
            }
        }

        public JsonResult ExportPDF(DateTime? s, DateTime? e, string groupGood, string staff, string warehouse)
        {
            try
            {
                var session = (User)Session["User"];
                // Tạo đường dẫn tới file tạm trong thư mục Temp
                string tempFilePath = Path.Combine(Path.GetTempPath(), "Nhom_Hang_Hoa.pdf");

                string fontPath = Server.MapPath("~/fonts/tahoma.ttf");

                //var c = db.GroupGoods.Select(x => new
                //{
                //    x.Name,
                //    x.Description,
                //    x.CreateDate,
                //    x.CreateBy
                //}).ToList();

                if (groupGood == null)
                    groupGood = "";
                if (staff == null)
                    staff = "";
                if (warehouse == null)
                    warehouse = "";
                if (s == null)
                    s = new DateTime(1900, 12, 12);
                if (e == null)
                    e = new DateTime(3000, 12, 12);

                var goods = db.Goods.ToList()
                              .Select(x => new
                              {
                                  x.Name,
                                  NameGroupGood = x.IdGroupGood != null ? x.GroupGood.Name : "",
                                  Warehouse = string.Join(", ", db.DetailWareHouses
                                            .Where(u => u.IdGoods == x.Id && u.Inventory >= 1)
                                            .Select(j => j.WareHouse.Name)),
                                  x.Inventory,
                                  x.CreateDate,
                                  x.CreateBy,
                                  x.ModifyDate,
                                  x.ModifyBy
                              })
                              .ToList()
                              .Where(x => (x.CreateBy.Contains(staff) && x.NameGroupGood.Contains(groupGood) && x.CreateDate <= e && x.CreateDate >= s && x.Warehouse.Contains(warehouse)));

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

                    document.Add(new Paragraph(rm.GetString("good_print"))
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
                        .SetFontColor(new DeviceRgb(51, 51, 51)));                             // Thiết lập in đậm (nếu muốn)

                    // Tạo một bảng trong PDF (ví dụ: 4 cột)
                    var table = new iText.Layout.Element.Table(UnitValue.CreatePercentArray(8)).UseAllAvailableWidth();

                    var yellowColor = new DeviceRgb(255, 255, 0); // Màu vàng

                    // Thêm tiêu đề cột
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("good_name"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("good_group"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("wh_noti"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("inventory"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("create_date"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("create_by"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("modify_date"))).SetBackgroundColor(yellowColor));
                    table.AddHeaderCell(new Cell().Add(new Paragraph(rm.GetString("modify_by"))).SetBackgroundColor(yellowColor));

                    foreach (var good in goods)
                    {
                        table.AddCell(good.Name);
                        table.AddCell(good.NameGroupGood);
                        table.AddCell(good.Warehouse);
                        table.AddCell(good.Inventory.ToString());
                        table.AddCell(good.CreateDate.HasValue ? good.CreateDate.Value.ToString("dd-MM-yyyy") : "");
                        table.AddCell(good.CreateBy);
                        table.AddCell(good.ModifyDate.HasValue ? good.ModifyDate.Value.ToString("dd-MM-yyyy") : "");
                        table.AddCell(good.ModifyBy);
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
                var filePath = "Hàng hóa";
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

        public JsonResult ExportCSV(DateTime? s, DateTime? e, string groupGood, string staff, string warehouse)
        {
            try
            {
                var session = (User)Session["User"];
                if (groupGood == null)
                    groupGood = "";
                if (staff == null)
                    staff = "";
                if (warehouse == null)
                    warehouse = "";
                if (s == null)
                    s = new DateTime(1900, 12, 12);
                if (e == null)
                    e = new DateTime(3000, 12, 12);

                var goods = db.Goods.ToList()
                              .Select(x => new
                              {
                                  x.Name,
                                  NameGroupGood = x.IdGroupGood != null ? x.GroupGood.Name : "",
                                  Warehouse = string.Join(", ", db.DetailWareHouses
                                            .Where(u => u.IdGoods == x.Id && u.Inventory >= 1)
                                            .Select(j => j.WareHouse.Name)),
                                  x.Inventory,
                                  x.CreateDate,
                                  x.CreateBy,
                                  x.ModifyDate,
                                  x.ModifyBy
                              })
                              .ToList()
                              .Where(x => (x.CreateBy.Contains(staff) && x.NameGroupGood.Contains(groupGood) && x.CreateDate <= e && x.CreateDate >= s && x.Warehouse.Contains(warehouse)));

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
                sb.AppendLine(rm.GetString("good_print"));
                sb.AppendLine();
                sb.AppendLine($"{rm.GetString("print_time")}: {DateTime.Now:dd-MM-yyyy}");
                sb.AppendLine($"{rm.GetString("account_print")}: {session.Name}");
                sb.AppendLine();
                // Thêm tiêu đề cột vào CSV
                sb.AppendLine($"{rm.GetString("good_name")},{rm.GetString("good_group")},{rm.GetString("wh_noti")},{rm.GetString("inventory")},{rm.GetString("create_date")},{rm.GetString("create_by")},{rm.GetString("modify_date")},{rm.GetString("modify_by")}");

                // Thêm dữ liệu vào CSV
                foreach (var good in goods)
                {
                    var getWH = "";
                    // Bảo vệ chuỗi nếu cần
                    if (good.Warehouse.Contains(","))
                    {
                        getWH = $"\"{good.Warehouse}\"";
                    }
                    sb.AppendLine($"{good.Name},{good.NameGroupGood},{getWH},{good.Inventory},{good.CreateDate:dd-MM-yyyy}, {good.CreateBy},{good.ModifyDate:dd-MM-yyyy}, {good.ModifyBy}");
                }

                // Tạo file CSV tạm thời
                var filePath = Path.Combine(Path.GetTempPath(), "Nhom_hang_hoa.csv");

                // Ghi vào file
                System.IO.File.WriteAllText(filePath, sb.ToString(), Encoding.UTF8);

                // Trả về file cho người dùng tải về
                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                // Mã hóa fileBytes thành chuỗi Base64
                var fileBase64 = Convert.ToBase64String(fileBytes);

                var fileName = "Hàng hóa";
                // Xóa file CSV tạm sau khi trả về
                System.IO.File.Delete(filePath);


                return Json(new { code = 200, msg = rm.GetString("csv"), fileContent = fileBase64, fileName = fileName }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult ExportExcel(DateTime? s, DateTime? e, string groupGood, string staff, string warehouse)
        {
            try
            {
                var session = (User)Session["User"];
                if (groupGood == null)
                    groupGood = "";
                if (staff == null)
                    staff = "";
                if (warehouse == null)
                    warehouse = "";
                if (s == null)
                    s = new DateTime(1900, 12, 12);
                if (e == null)
                    e = new DateTime(3000, 12, 12);

                var goods = db.Goods.ToList()
                              .Select(x => new
                              {
                                  x.Id,
                                  x.Name,
                                  NameGroupGood = x.IdGroupGood != null ? x.GroupGood.Name : "",
                                  Unit = x.IdUnit != null ? x.Unit.Name : "",
                                  Warehouse = string.Join(", ", db.DetailWareHouses
                                            .Where(u => u.IdGoods == x.Id && u.Inventory >= 1)
                                            .Select(j => j.WareHouse.Name)),
                                  x.Inventory,
                                  x.Description,
                                  x.CreateDate,
                                  x.CreateBy,
                                  x.ModifyDate,
                                  x.ModifyBy
                              })
                              .ToList()
                              .Where(x => (x.CreateBy.Contains(staff) && x.NameGroupGood.Contains(groupGood) && x.CreateDate <= e && x.CreateDate >= s && x.Warehouse.Contains(warehouse)));

                var fileName = rm.GetString("Hàng Hóa");
                var filePath = Path.Combine(Path.GetTempPath(), fileName);

                using (ExcelPackage excelPackage = new ExcelPackage())
                {
                    // Tạo một worksheet mới
                    var worksheet = excelPackage.Workbook.Worksheets.Add(rm.GetString("goods_data"));

                    // Định dạng màu
                    var titleColor = System.Drawing.Color.FromArgb(0, 123, 255); // Màu xanh nước
                    var subtitleColor = System.Drawing.Color.FromArgb(85, 85, 85); // Màu xám nhạt
                    var headerColor = System.Drawing.Color.FromArgb(255, 255, 0); // Màu vàng

                    worksheet.Cells["A1:H1"].Merge = true;
                    worksheet.Cells["A1"].Value = rm.GetString("good_print");
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
                    //    C1 = "Tên hàng hóa",
                    //    C2 = "Nhóm hàng",
                    //    C3 = "Kho",
                    //    C4 = "Tồn kho",
                    //    C5 = "Ngày tạo",
                    //    C6 = "Người tạo",
                    //    C7 = "Ngày chỉnh sửa",
                    //    C8 = "Người chỉnh sửa"
                    //};

                    //datas.Add(data);

                    //foreach (var good in goods)
                    //{
                    //    EightColumnExcel dataGroup = new EightColumnExcel()
                    //    {
                    //        C1 = good.Name,
                    //        C2 = good.NameGroupGood,
                    //        C3 = good.Warehouse,
                    //        C4 = good.Inventory.ToString(),
                    //        C5 = good.CreateDate.HasValue ? good.CreateDate.Value.ToString("dd-MM-yyyy") : "",
                    //        C6 = good.CreateBy,
                    //        C7 = good.ModifyDate.HasValue ? good.ModifyDate.Value.ToString("dd-MM-yyyy") : "",
                    //        C8 = good.ModifyBy,

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
                    var headers = new[] { rm.GetString("good_id"), rm.GetString("good_name"), rm.GetString("description"), rm.GetString("good_group"), rm.GetString("unit"), rm.GetString("wh_noti"), rm.GetString("inventory") };
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
                    foreach (var good in goods)
                    {
                        worksheet.Cells[rowIndex, 1].Value = good.Id;
                        worksheet.Cells[rowIndex, 2].Value = good.Name;
                        worksheet.Cells[rowIndex, 3].Value = good.Description;
                        worksheet.Cells[rowIndex, 4].Value = good.NameGroupGood;
                        worksheet.Cells[rowIndex, 5].Value = good.Unit;
                        worksheet.Cells[rowIndex, 6].Value = good.Warehouse;
                        worksheet.Cells[rowIndex, 7].Value = good.Inventory;
                        rowIndex++;
                    }

                    // Định dạng
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Top.Style = ExcelBorderStyle.Thin;
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Left.Style = ExcelBorderStyle.Thin;
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Right.Style = ExcelBorderStyle.Thin;
                    //worksheet.Cells[6, 1, rowIndex - 1, 5].Style.Border.Bottom.Style = ExcelBorderStyle.Thin;

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

        [HttpPost]
        public JsonResult GetPrintData(DateTime? s, DateTime? e, string groupGood, string staff, string warehouse)
        {
            try
            {
                var session = (User)Session["user"];
                if (groupGood == null)
                    groupGood = "";
                if (staff == null)
                    staff = "";
                if (warehouse == null)
                    warehouse = "";
                if (s == null)
                    s = new DateTime(1900, 12, 12);
                if (e == null)
                    e = new DateTime(3000, 12, 12);

                var goods = db.Goods.ToList()
                              .Select(x => new
                              {
                                  x.Name,
                                  NameGroupGood = x.IdGroupGood != null ? x.GroupGood.Name : "",
                                  Warehouse = string.Join(", ", db.DetailWareHouses
                                            .Where(u => u.IdGoods == x.Id && u.Inventory >= 1)
                                            .Select(j => j.WareHouse.Name)),
                                  x.Inventory,
                                  x.CreateDate,
                                  x.CreateBy,
                                  x.ModifyDate,
                                  x.ModifyBy
                              })
                              .ToList()
                              .Where(x => (x.CreateBy.Contains(staff) && x.NameGroupGood.Contains(groupGood) && x.CreateDate <= e && x.CreateDate >= s && x.Warehouse.Contains(warehouse)));
                var date = DateTime.Now.ToString("dd-MM-yyyy");
                return Json(new { code = 200, name = session.Name, list = goods, date = date });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult UpdateHeaderBill(string data)
        {
            try
            {
                if (!string.IsNullOrEmpty(data))
                {
                    var getUpdateData = JsonConvert.DeserializeObject<Dictionary<string, string>>(data);
                    // Tạo nội dung mới cho file JS
                    string jsContent = $"var dataBill = {JsonConvert.SerializeObject(getUpdateData, Formatting.Indented)};";

                    // Đường dẫn tới file cần ghi đè (cập nhật đường dẫn theo dự án của bạn)
                    string filePath = Server.MapPath("~/PrintDetail/DataBill.js");

                    try
                    {
                        // Ghi đè file JS
                        System.IO.File.WriteAllText(filePath, jsContent);
                    }
                    catch (Exception ex)
                    {
                        return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
                    }
                }
                return Json(new { code = 200, msg = rm.GetString("SucessEdit") });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }
    }
}