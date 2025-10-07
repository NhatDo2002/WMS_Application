using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data.Entity.Validation;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Resources;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using static WMS.Models.DataForm;
using WMS.Controllers;
using WMS.Models;
using WMS.ViewModel;
using Microsoft.SqlServer.Management.Sdk.Differencing.SPI;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;
using System.Globalization;

namespace WMS.Areas.WarehouseManagement.Controllers
{
    public class SaleOrderController : BaseController
    {
        private WMSEntities db = new WMSEntities();
        private AuthorizationController author = new AuthorizationController();
        ResourceManager rm = new ResourceManager("WMS.App_GlobalResources.Resource", typeof(Resources.Resource).Assembly);
        string scanned = "Đã quét";
        string notScanned = "Chưa quét";
        string notScannedYet = "Chưa quét xong";
        // GET: SaleOrder
        public ActionResult Index()
        {
            return View();
        }
        public ActionResult List()
        {
            var viewModel = new SaleOrderViewModel
            {
                Warehouse = new SelectList(db.WareHouses.ToList(), "Id", "Name"),
            };
            return View(viewModel);
        }

        [HttpGet]
        public JsonResult Customer()
        {
            try
            {
                var c = (from b in db.Customers.Where(x => x.Id.Length > 0)
                         select new
                         {
                             id = b.Id,
                             name = b.Name
                         }).ToList();
                return Json(new { code = 200, data = c, }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetCustomerById(string id)
        {
            try
            {
                var c = (from b in db.Customers.Where(x => x.Id.Length > 0 && x.Id == id)
                         select new
                         {
                             id = b.Id,
                             name = b.Name,
                             address = b.AddRess
                         }).FirstOrDefault();
                return Json(new { code = 200, data = c, }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult WareHouse()
        {
            try
            {
                var h = (from b in db.WareHouses.Where(x => x.Id.Length > 0)
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
        public JsonResult GetGoodsByWarehouseID(string warehouseID)
        {
            try
            {
                var listGoods = db.DetailWareHouses
                    .AsNoTracking()
                    .Where(x => x.IdWareHouse == warehouseID)
                    .Select(good => new GoodsDto
                    {
                        Id = good.IdGoods,
                        Name = db.Goods.FirstOrDefault(g => g.Id == good.IdGoods).Name,
                        Inventory = good.Inventory,
                        IdUnit = db.Goods.FirstOrDefault(g => g.Id == good.IdGoods).IdUnit
                    })
                    .ToList();
                if (listGoods.Any())
                {
                    var unitMapping = db.Units.ToDictionary(x => x.Id, x => x.Name);

                    foreach (var item in listGoods)
                    {
                        item.IdUnit = !string.IsNullOrEmpty(item.IdUnit) && unitMapping.ContainsKey(item.IdUnit)
                            ? unitMapping[item.IdUnit]
                            : null;
                    }
                }
                return Json(new { code = 200, data = listGoods }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public async Task<JsonResult> Add()
        {
            try
            {
                var session = (WMS.Models.User)Session["user"];
                if (Request.Form.Count > 0)
                {
                    if (Request.Form["warehouse"] == "-1")
                    {
                        return Json(new { code = 500, msg = rm.GetString("Chọn Kho Hàng Để Tiếp Tục").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    if (Request.Form["customer"] == "-1")
                    {
                        return Json(new { code = 500, msg = rm.GetString("Chọn Khách Hàng Để Tiếp Tục").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    var ttSum = int.Parse(Request.Form["tt"]);
                    var idWareHouse = Request.Form["warehouse"];
                    var minInvetory = db.WareHouses.Find(idWareHouse).MinInventory;
                    var maxInvetory = db.WareHouses.Find(idWareHouse).MaxInventory;
                    SalesOrder salesOrder = new SalesOrder()
                    {
                        IdWareHouse = Request.Form["warehouse"],
                        IdCustomer = Request.Form["customer"],
                        Name = Request.Form["name"],
                        Description = Request.Form["des"],
                        CreateBy = session.Name,
                        CreateDate = DateTime.Now,
                        ModifyBy = session.Name,
                        ModifyDate = DateTime.Now,
                        Status = false,
                    };
                    var id = "";
                    var checkId = new SalesOrder();
                    do
                    {
                        id = await Encode.GenerateRandomString(7);
                        checkId = db.SalesOrders.Find(id);
                    } while (checkId != null);
                    salesOrder.Id = id;
                    List<DetailSaleOrder> data = new List<DetailSaleOrder>();
                    var idGoods = "";
                    int ttGoodsWare = 0;
                    int ttReadySale = 0;
                    int ttCurrent = 0;
                    foreach (string key in Request.Form)
                    {
                        if (key.StartsWith("data"))
                        {
                            string[] parts = key.Split('.');
                            string input = parts[0];
                            Match match = Regex.Match(input, @"\d+");
                            int index = 0;
                            if (match.Success)
                            {
                                index = int.Parse(match.Value); // Extract the index from the key
                            }

                            string propertyName = parts[1]; // Extract the property name from the key

                            if (data.Count <= index)
                            {
                                data.Add(new DetailSaleOrder());
                            }
                            var nameWareHouse = db.WareHouses.Find(idWareHouse).Name;

                            if (propertyName == "IdGoods")
                            {
                                idGoods = Request.Form[key];
                                var listReadySale = db.DetailSaleOrders
                                   .Where(d => d.Status == false && d.SalesOrder.IdWareHouse == idWareHouse && d.IdGoods == idGoods).ToList();
                                var GoodsWare = db.DetailWareHouses
                                    .Where(d => d.IdWareHouse == idWareHouse && d.IdGoods == idGoods).ToList();
                                if (GoodsWare != null)
                                {
                                    ttGoodsWare = (int)GoodsWare.FirstOrDefault().Inventory;
                                }
                                else
                                {
                                    return Json(new { code = 500, msg = $"{rm.GetString("Mã Hàng")} {idGoods} {rm.GetString("Không Tồn Tại Trong Kho")}" }, JsonRequestBehavior.AllowGet);
                                }
                                if (listReadySale != null)
                                {
                                    ttReadySale = (int)listReadySale.Sum(c => c.Quantity);
                                }
                                data[index].IdGoods = idGoods;
                            }
                            else if (propertyName == "Quantity")
                            {
                                ttCurrent = int.Parse(Request.Form[key]);
                                data[index].Quantity = float.Parse(Request.Form[key]);
                            }
                            if (ttGoodsWare - ttReadySale < ttCurrent)
                            {
                                return Json(new { code = 500, msg = $"{rm.GetString("Mã Hàng")} {idGoods} {rm.GetString("Trong")} {nameWareHouse} {rm.GetString("Không Đủ Để Xuất")}" }, JsonRequestBehavior.AllowGet);
                            }
                            data[index].CreateDate = DateTime.Now;
                            data[index].ModifyDate = DateTime.Now;
                            data[index].CreateBy = session.Name;
                            data[index].ModifyBy = session.Name;
                            data[index].IdSaleOrder = id;
                            data[index].Status = false;
                        }
                    }
                    db.SalesOrders.Add(salesOrder);
                    db.DetailSaleOrders.AddRange(data);
                    db.SaveChanges();
                    return Json(new { code = 200, id, msg = rm.GetString("Tạo Phiếu Xuất Hàng Thành Công").ToString() }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("Không Nhận Được Tất Cả Dữ Liệu").ToString() }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        //[HttpGet]
        //public JsonResult Bill(string id)
        //{
        //    try
        //    {
        //        var session = (User)Session["user"];
        //        var nameAdmin = session.User1;
        //        if (!string.IsNullOrEmpty(id))
        //        {
        //            var c = (from b in db.SalesOrders.Where(x => x.Id == id)
        //                     select new
        //                     {
        //                         id = b.Id,
        //                         createdate = b.CreateDate.Value.Day + "/" + b.CreateDate.Value.Month + "/" + b.CreateDate.Value.Year,
        //                         customer = b.Customer.Name,
        //                         address = b.Customer.AddRess,
        //                         ware = b.WareHouse.Name,
        //                         status = b.Status,
        //                         typeStatus = b.IdTypeStatus
        //                     }).ToList();

        //            if (c.Count == 0)
        //            {
        //                return Json(new { code = 500, msg = rm.GetString("Mã Phiếu Xuất Không Tồn Tại").ToString() }, JsonRequestBehavior.AllowGet);
        //            }
        //            var saleOrder = db.SalesOrders.Find(id);
        //            var getListDeliSO = db.Deliveries.Where(x => x.IdSalesOrder == id)
        //                .Select(ds => new
        //                {
        //                    ds.Id,
        //                    detailDeliveries = db.DetailDeliveries.Where(dd => dd.IdDelivery == ds.Id)
        //                                                          .Select(y => new
        //                                                          {
        //                                                              y.Id,
        //                                                              y.IdGood,
        //                                                              y.Quantity,
        //                                                              y.QuantityScan
        //                                                          })
        //                })
        //                .ToList();

        //            var e = (from b in db.DetailSaleOrders.Where(x => x.IdSaleOrder == id)
        //                     select new
        //                     {
        //                         id = b.Id,
        //                         idgood = b.IdGoods,
        //                         name = b.Good.Name,
        //                         unit = b.Good.Unit.Name == null ? "" : b.Good.Unit.Name,
        //                         gr = b.Good.GroupGood.Name == null ? "" : b.Good.GroupGood.Name,
        //                         identifier = b.Good.Identifier,
        //                         qtt = b.Quantity,
        //                         qttscan = b.QuantityScan,
        //                     }).ToList();

        //            var listDeliveryOfSaleOrder = db.Deliveries
        //                                            .AsNoTracking()
        //                                            .Where(x => x.IdSalesOrder == id)
        //                                            .ToList();

        //            var listGoodEPC = new List<GoodEPC>();

        //            //foreach (var good in e)
        //            //{
        //            //    var getEPC = db.EPCs
        //            //                 .Where(eg => eg.IdWareHouse == saleOrder.IdWareHouse && eg.IdGoods == good.idgood && eg.IdDelivery == null && eg.Status == true && eg.ExportStatus == null)
        //            //                 .Select(x => new {
        //            //                     x.IdGoods,
        //            //                     x.IdEPC,
        //            //                     x.IdSerial
        //            //                 })
        //            //                 .ToList();
        //            //    foreach (var epc in getEPC)
        //            //    {
        //            //        listGoodEPC.Add(new GoodEPC
        //            //        {
        //            //            IdGoods = epc.IdGoods,
        //            //            IdEPC = epc.IdEPC,
        //            //            IdSerial = epc.IdSerial
        //            //        });
        //            //    }
        //            //    foreach (var item in getListDeliSO)
        //            //    {
        //            //        var getReadedEPC = db.EPCs
        //            //                 .Where(eg => eg.IdGoods == good.idgood && eg.IdDelivery == item.Id)
        //            //                 .Select(x => new {
        //            //                     x.IdGoods,
        //            //                     x.IdEPC,
        //            //                     x.IdSerial
        //            //                 })
        //            //                 .ToList();
        //            //        foreach (var epc in getReadedEPC)
        //            //        {
        //            //            listAlreadyReadEPC.Add(new GoodEPC
        //            //            {
        //            //                IdGoods = epc.IdGoods,
        //            //                IdEPC = epc.IdEPC,
        //            //                IdSerial = epc.IdSerial
        //            //            });
        //            //        }
        //            //    }
        //            //}
        //            var updatedList = e.Select(item =>
        //            {
        //                var deliveryIds = listDeliveryOfSaleOrder.Select(d => d.Id).ToList();

        //                var quantityScan = db.DetailSaleOrders
        //                                     .Where(x => x.IdGoods == item.idgood && deliveryIds.Contains(x.IdDelivery))
        //                                     .Count();
        //                var getQtyScan = item.qttscan;
        //                if (getQtyScan == null)
        //                {
        //                    getQtyScan = 0;
        //                }
        //                return new
        //                {
        //                    id = item.id,
        //                    idgood = item.idgood,
        //                    name = item.name,
        //                    unit = item.unit,
        //                    gr = item.gr,
        //                    qtt = item.qtt,
        //                    qttscan = getQtyScan + quantityScan,
        //                    identifier = item.identifier
        //                };
        //            }).ToList();
        //            return Json(new { code = 200, c, updatedList, listGoodEPC, listAlreadyReadEPC = getListDeliSO, msg = rm.GetString("Mã Phiếu Xuất Hợp Lệ").ToString() }, JsonRequestBehavior.AllowGet);
        //        }
        //        else
        //        {
        //            return Json(new { code = 500, msg = rm.GetString("Vui Lòng Nhập Mã Phiếu Xuất").ToString() }, JsonRequestBehavior.AllowGet);
        //        }
        //    }
        //    catch (Exception e)
        //    {
        //        return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}

        [HttpGet]
        public JsonResult Bill(string id)
        {
            try
            {
                var session = (User)Session["user"];
                var nameAdmin = session.User1;
                if (!string.IsNullOrEmpty(id))
                {
                    var c = (from b in db.SalesOrders.Where(x => x.Id == id)
                             select new
                             {
                                 id = b.Id,
                                 createdate = b.CreateDate.Value.Day + "/" + b.CreateDate.Value.Month + "/" + b.CreateDate.Value.Year,
                                 customer = b.Customer.Name,
                                 address = b.Customer.AddRess,
                                 ware = b.WareHouse.Name,
                                 status = b.Status,
                                 typeStatus = b.IdTypeStatus
                             }).ToList();

                    if (c.Count == 0)
                    {
                        return Json(new { code = 500, msg = rm.GetString("Mã Phiếu Xuất Không Tồn Tại").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    var saleOrder = db.SalesOrders.Find(id);
                    var getListDeliSO = db.Deliveries.Where(x => x.IdSalesOrder == id)
                        .Select(ds => new
                        {
                            ds.Id,
                            detailDeliveries = db.DetailDeliveries.Where(dd => dd.IdDelivery == ds.Id)
                                                                  .Select(y => new
                                                                  {
                                                                      y.Id,
                                                                      y.IdGood,
                                                                      y.Quantity,
                                                                      y.QuantityScan
                                                                  })
                        })
                        .ToList();

                    var e = (from b in db.DetailSaleOrders.Where(x => x.IdSaleOrder == id)
                             select new
                             {
                                 id = b.Id,
                                 idgood = b.IdGoods,
                                 name = b.Good.Name,
                                 unit = b.Good.Unit.Name == null ? "" : b.Good.Unit.Name,
                                 gr = b.Good.GroupGood.Name == null ? "" : b.Good.GroupGood.Name,
                                 identifier = b.Good.Identifier,
                                 qtt = b.Quantity,
                                 qttscan = b.QuantityScan,
                             }).ToList();

                    var listDeliveryOfSaleOrder = db.Deliveries
                                                    .AsNoTracking()
                                                    .Where(x => x.IdSalesOrder == id)
                                                    .ToList();

                    var updatedList = e.Select(item =>
                    {
                        var deliveryIds = listDeliveryOfSaleOrder.Select(d => d.Id).ToList();
                        //var getAllDetailPO = db.DetailGoodOrders.Where(x => x.IdGoods == item.idgood && x.CurrentQuantity != null && x.CurrentQuantity > 0).OrderBy(x => x.CreateDate).ToList();
                        //var listSuitableDetailPO = new List<DetailGoodOrder>();
                        double? count = 0;
                        //foreach(var dpo in getAllDetailPO)
                        //{
                        //    count += dpo.CurrentQuantity;
                        //    var addedDPO = new DetailGoodOrder()
                        //    {
                        //        IdGoods = dpo.IdGoods,
                        //        CreateDate = dpo.CreateDate,
                        //        //Location = dpo.Location
                        //    };
                        //    if (count >= item.qtt)
                        //    {
                        //        addedDPO.Quantity = dpo.CurrentQuantity - (count - item.qtt);
                        //        listSuitableDetailPO.Add(addedDPO);
                        //        break;
                        //    }
                        //    addedDPO.Quantity = dpo.CurrentQuantity;
                        //    listSuitableDetailPO.Add(addedDPO);
                        //}

                        var quantityScan = db.DetailSaleOrders
                                             .Where(x => x.IdGoods == item.idgood && deliveryIds.Contains(x.IdDelivery))
                                             .Count();
                        var getQtyScan = item.qttscan;
                        if (getQtyScan == null)
                        {
                            getQtyScan = 0;
                        }
                        return new
                        {
                            id = item.id,
                            idgood = item.idgood,
                            name = item.name,
                            unit = item.unit,
                            gr = item.gr,
                            qtt = item.qtt,
                            qttscan = getQtyScan + quantityScan,
                            identifier = item.identifier,
                            //listDPO = listSuitableDetailPO,
                        };
                    }).ToList();
                    return Json(new { code = 200, c, updatedList, listAlreadyReadEPC = getListDeliSO, msg = rm.GetString("Mã Phiếu Xuất Hợp Lệ").ToString() }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("Vui Lòng Nhập Mã Phiếu Xuất").ToString() }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetSaleQuantityStatistics()
        {
            try
            {
                var dict = new Dictionary<int, double?>
                {
                    {1 ,0 },
                    {2 ,0 },
                    {3 ,0 },
                    {4 ,0 },
                    {5 ,0 },
                    {6 ,0 },
                    {7 ,0 },
                    {8 ,0 },
                    {9 ,0 },
                    {10 ,0 },
                    {11 ,0 },
                    {12 ,0 }
                };
                var validDeliveries = db.Deliveries
                    .Where(y => y.HandlingStatus == 2)
                    .Select(y => y.Id);

                var data = db.DetailDeliveries
                    .Where(x => x.QuantityScan != null && validDeliveries.Contains(x.IdDelivery))
                    .GroupBy(a => new
                    {
                        Year = DbFunctions.TruncateTime(a.CreateDate).Value.Year,
                        Month = DbFunctions.TruncateTime(a.CreateDate).Value.Month
                    }) // Group by Year and Month
                    .Select(p => new
                    {
                        month = p.Key.Month,
                        total = p.Sum(q => q.QuantityScan)
                    })
                    .OrderBy(x => x.month)
                    .ToList();

                var month = data.Select(x => x.month).ToList();
                var totals = data.Select(x => x.total).ToList();
                for (int i = 0; i < month.Count(); i++)
                {
                    dict[month[i]] = totals[i];
                }

                month.Clear();
                totals.Clear();

                foreach (var dictionary in dict)
                {
                    month.Add(dictionary.Key);
                    totals.Add(dictionary.Value);
                }

                return Json(new { code = 200, month = month, totals = totals }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = e.Message.Trim() }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetSaleStatistics()
        {
            try
            {
                var data = db.SalesOrders
                    .Where(x => x.CreateDate.HasValue)
                    .GroupBy(x => DbFunctions.TruncateTime(x.CreateDate))
                    .Select(p => new
                    {
                        date = DbFunctions.TruncateTime(p.Key),
                        total = p.Count()
                    })
                    .OrderBy(x => x.date)
                    .ToList();

                var dates = data.Select(x => x.date).ToList();
                var totals = data.Select(x => x.total).ToList();

                return Json(new { code = 200, dates = dates, totals = totals }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = e.Message.Trim() }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult ShowListSaleOrder(pagination pagination, Sort sort, DataForm.query query)
        {
            try
            {
                var sortField = sort == null ? "id" : (sort.field == null ? "id" : sort.field);
                if (query == null)
                {
                    query = new DataForm.query();
                }
                if (query.handlingStatus == null)
                    query.handlingStatus = "";
                if (query.warehouse == null)
                    query.warehouse = "";
                if (query.status == null)
                {
                    query.status = "";
                }
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
                if (query.idpurchase == null)
                    query.idpurchase = "";
                if (query.staff == null)
                    query.staff = "";

                var handling = 0;
                var getHandling = db.HandlingStatus.Where(u => u.HandlingStatusID == query.handlingStatus).FirstOrDefault();
                if(getHandling != null)
                {
                    handling = getHandling.Id;
                }

                var dataSO = from p in db.SalesOrders
                             where p.IdWareHouse.Contains(query.warehouse) &&
                                               p.Id.Contains(query.idpurchase) &&
                                               p.CreateDate >= sDate &&
                                               p.CreateDate <= eDate &&
                                               p.CreateBy.Contains(query.staff) &&
                                               (handling == 0 || p.HandlingStatus == handling)
                             select new SOResponseData()
                             {
                                 id = p.Id,
                                 idwarehouse = p.Id,
                                 namewarehouse = p.WareHouse.Name,
                                 createdate = p.CreateDate,
                                 namecustomer = p.Customer.Name,
                                 status = p.Status == true ? scanned : (db.DetailSaleOrders.Where(x => x.QuantityScan != null && x.IdSaleOrder == p.Id).Any() == true ? notScannedYet : notScanned),
                                 handlingStatus = db.HandlingStatus.Where(u => u.Id == p.HandlingStatus).FirstOrDefault().HandlingStatusName,
                                 deliveryDate = p.DeliveryDate,
                                 createBy = p.CreateBy,
                                 typeStatus = p.IdTypeStatus,
                                 description = p.Description
                             };
                if (query.status == "false2")
                {
                    dataSO = from d in dataSO
                             where d.status == notScannedYet
                             select d;
                }
                else if (query.status == "true")
                {
                    dataSO = from d in dataSO
                             where d.status == scanned
                             select d;
                }
                else if (query.status == "false")
                {
                    dataSO = from d in dataSO
                             where d.status == notScanned
                             select d;
                }
                dataSO = dataSO.OrderBy(sortField);
                if (sort.sort == "desc")
                {
                    dataSO = dataSO.OrderBy($"{sortField} DESC"); // Sắp xếp giảm dần
                }

                var finalData = dataSO.AsEnumerable().Select((x, index) => new
                {
                    No = index + 1, // Cộng 1 để bắt đầu từ 1
                    x.id,
                    x.idwarehouse,
                    x.namewarehouse,
                    x.createdate,
                    x.namecustomer,
                    x.status,
                    x.handlingStatus,
                    x.deliveryDate,
                    x.createBy,
                    x.description
                }).ToList();
                var data = finalData.Skip((pagination.page - 1) * pagination.perpage).Take(pagination.perpage).ToList();
                var pages = (int)Math.Ceiling((double)finalData.Count() / pagination.perpage);
                var total = finalData.Count();

                return Json(new
                {
                    code = 200,
                    meta = new meta()
                    {
                        page = pagination.page,
                        pages = pages,
                        perpage = pagination.perpage,
                        total = total,
                        sort = sort.sort,
                        field = sort.field
                    },
                    data
                }, JsonRequestBehavior.AllowGet);
                //var listSaleOrder = db.SalesOrders
                //    .Include(x => x.Customer)
                //    .Include(x => x.WareHouse)
                //    .Select(x => new
                //    {
                //        SaleOrderId = x.Id,
                //        WarehouseName = x.WareHouse.Name,
                //        CreateDate = x.CreateDate,
                //        CustomerName = x.Customer.Name,
                //        HandlingStatus = x.HandlingStatus,
                //        Status = x.Status
                //    })
                //    .ToList()
                //    .Select((x, index) => new SaleOrderResponseDto
                //    {
                //        STT = index + 1,
                //        SaleOrderId = x.SaleOrderId,
                //        WarehouseName = x.WarehouseName,
                //        CreateDate = x.CreateDate.HasValue ? x.CreateDate.Value.ToString("dd/MM/yyyy") : null,
                //        CustomerName = x.CustomerName,
                //        HandlingStatus = x.HandlingStatus,
                //        Status = x.Status
                //    })
                //    .ToList();

                //foreach (var item in listSaleOrder)
                //{
                //    var checkIsScanning = db.Deliveries.Where(x => x.IdSalesOrder == item.SaleOrderId).ToList();

                //    if (checkIsScanning.Any() && item.Status == false)
                //    {
                //        item.ScanStatus = "Chưa quét xong";
                //    }
                //    else if (checkIsScanning.Any() && item.Status == true)
                //    {
                //        item.ScanStatus = "Đã quét";
                //    }
                //    else
                //    {
                //        item.ScanStatus = "Chưa quét";
                //    }
                //}
                //if (query != null)
                //{
                //    if (!string.IsNullOrEmpty(query.tungay) && !string.IsNullOrEmpty(query.denngay))
                //    {
                //        listSaleOrder = listSaleOrder.Where(order => DateTime.ParseExact(order.CreateDate, "dd/MM/yyyy", CultureInfo.InvariantCulture) >= DateTime.ParseExact(query.tungay, "yyyy-MM-dd", CultureInfo.InvariantCulture)
                //                                                    && DateTime.ParseExact(order.CreateDate, "dd/MM/yyyy", CultureInfo.InvariantCulture) <= DateTime.ParseExact(query.denngay, "yyyy-MM-dd", CultureInfo.InvariantCulture))
                //                                                    .ToList();
                //    }
                //    if (!string.IsNullOrEmpty(query.WarehouseName) && query.WarehouseName != "Tất cả")
                //    {
                //        listSaleOrder = listSaleOrder.Where(x => x.WarehouseName == query.WarehouseName).ToList();
                //    }
                //    if (!string.IsNullOrEmpty(query.ScanStatus) && query.ScanStatus != "Tất cả")
                //    {
                //        listSaleOrder = listSaleOrder.Where(x => x.ScanStatus == query.ScanStatus).ToList();
                //    }
                //    if (!string.IsNullOrEmpty(query.generalSearch))
                //    {
                //        listSaleOrder = listSaleOrder.Where(x => x.SaleOrderId.Contains(query.generalSearch)).ToList();
                //    }
                //}
                //return Json(new { code = 200, data = listSaleOrder });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult CheckGoodInSystem(string epc)
        {
            try
            {
                var getGood = db.EPCs.FirstOrDefault(g => g.IdEPC == epc && g.Status == true);
                if (getGood != null)
                {
                    var getWH = db.WareHouses.FirstOrDefault(w => w.Id == getGood.IdWareHouse);
                    return Json(new { code = 200, gId = getGood.IdGoods, gEPC = getGood.IdEPC, nameWH = getWH.Name });
                }
                else
                {
                    return Json(new { code = 400 });
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }

        //[HttpPost]
        //public JsonResult CheckGoodInSystemBarcode(string idGood)
        //{
        //    try
        //    {
        //        var getGood = db.EPCs.FirstOrDefault(g => g.IdGoods == idGood && g.Status == true);
        //        if (getGood != null)
        //        {
        //            var getWH = db.WareHouses.FirstOrDefault(w => w.Id == getGood.IdWareHouse);
        //            var getGoodName = db.Goods.FirstOrDefault(g => g.Id == getGood.IdGoods);
        //            if(getGoodName != null)
        //            {
        //                return Json(new { code = 200, gId = getGood.IdGoods, gName = getGoodName.Name, nameWH = getWH.Name });

        //            }
        //            else
        //            {
        //                return Json(new { code = 400 });

        //            }
        //        }
        //        else
        //        {
        //            return Json(new { code = 400 });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
        //    }
        //}

        [HttpPost]
        public JsonResult CheckGoodInSystemBarcode(string idGood)
        {
            try
            {
                var getGood = db.Goods.FirstOrDefault(g => g.Id == idGood);
                if (getGood != null)
                {
                    return Json(new { code = 200, gId = getGood.Id, gName = getGood.Name });
                }
                else
                {
                    return Json(new { code = 400 });
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult GetDetailSO(string id)
        {
            try
            {
                var getListGood = db.DetailSaleOrders
                                  .Where(x => x.IdSaleOrder == id)
                                  .Select(g => new
                                  {
                                      IdGoods = g.IdGoods,
                                      GoodName = db.Goods.FirstOrDefault(x => x.Id == g.IdGoods).Name,
                                      Quantity = g.Quantity,
                                      QuantityScan = g.QuantityScan
                                  }).ToList();
                return Json(new { code = 200, data = getListGood });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult UpdateSaleOrderStatus(string id)
        {
            try
            {
                var session = (User)Session["user"];
                var check = db.SalesOrders.Where(x => x.Id == id).FirstOrDefault();
                if (check.HandlingStatus == 2)
                {
                    return Json(new { code = 400, message = rm.GetString("sale_approve") });
                }
                check.HandlingStatus = 2;
                check.ModifyDate = DateTime.Now;
                check.ModifyBy = session.Name;

                var result = db.SaveChanges();
                if (result > 0)
                {
                    return Json(new { code = 200, message = rm.GetString("approve_success") });
                }
                else
                {
                    return Json(new { code = 500, message = rm.GetString("approve_failed") });
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DeliveryList(pagination pagination, Sort sort, DataForm.query query)
        {
            try
            {
                if (query == null)
                {
                    query = new DataForm.query();
                }
                if (query.idreceipt == null)
                    query.idreceipt = "";
                if (query.idSale == null)
                    query.idSale = "";
                var sortField = sort == null ? "Id" : (sort.field == null ? "Id" : sort.field);
                    var receipts = (from r in db.Deliveries
                                    where r.IdSalesOrder == query.idSale &&
                                       r.Id.Contains(query.idreceipt)
                                    select new
                                    {
                                        id = r.Id,
                                        idSO = r.IdSalesOrder,
                                        description = r.Description,
                                        createDate = r.CreateDate,
                                        createBy = r.CreateBy,
                                        status = r.Status == false ? "Chưa xuất" : "Đã xuất",
                                        handling = db.HandlingStatus.Where(u => u.Id == r.HandlingStatus).FirstOrDefault().HandlingStatusName,
                                        typeStatus = db.SalesOrders.Where(u => u.Id == r.IdSalesOrder).FirstOrDefault().IdTypeStatus
                                    });
                    var querys = receipts.OrderBy(sortField);
                    if (sort?.sort == "desc")
                    {
                        querys = querys.OrderBy($"{sortField} DESC");
                    }
                    // Total count before pagination
                    var totalCount = querys.Count();

                    // Apply pagination
                    var paginatedData = querys.Skip((pagination.page - 1) * pagination.perpage).Take(pagination.perpage).ToList();

                    // Return the result for KTDatatable
                    return Json(new
                    {
                        meta = new meta()
                        {
                            page = pagination.page,
                            perpage = pagination.perpage,
                            total = totalCount,
                            sort = sort.sort,
                            field = sort.field,
                        },
                        data = paginatedData
                    }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult> CreateSaleOrder(SaleOrderRequestDto data)
        {
            try
            {
                if (string.IsNullOrEmpty(data.IdSO)){
                    return Json(new { code = 500, message = rm.GetString("not_empty_so_id").ToString() });
                }
                if (!Regex.IsMatch(data.IdSO, @"^[a-zA-Z0-9_-]+$"))
                {
                    return Json(new { status = 500, message = rm.GetString("invalid_so_id").ToString() }, JsonRequestBehavior.AllowGet);
                }
                var checkIdSO = db.SalesOrders.FirstOrDefault(x => x.Id == data.IdSO);
                if(checkIdSO != null)
                {
                    return Json(new { status = 500, message = rm.GetString("Mã Phiếu Xuất Đã Tồn Tại").ToString() }, JsonRequestBehavior.AllowGet);
                }
                var session = (User)Session["user"];
                var saleOrder = new SalesOrder
                {
                    Id = data.IdSO,
                    IdWareHouse = data.WarehouseID,
                    IdCustomer = data.CustomerName,
                    CreateBy = session.Name,
                    CreateDate = DateTime.Now,
                    Description = data.Note,
                    Status = false,
                    HandlingStatus = data.HandlingStatusID,
                };
                var listGoods = new List<DetailSaleOrder>();
                var listInvalidQuantity = "";
                foreach (var goods in data.GoodsList)
                {
                    if(goods.Qty <= 0)
                    {
                        if(listInvalidQuantity == "")
                        {
                            listInvalidQuantity += goods.Id;
                        }
                        else
                        {
                            listInvalidQuantity += ", " + goods.Id;
                        }
                        continue;
                    }
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

                if(listInvalidQuantity != "")
                {
                    var msg = rm.GetString("invalid_input_create").ToString() + " " + listInvalidQuantity;
                    return Json(new { code = 500, message = msg });
                }

                var minimunStock = db.WareHouses
                    .AsNoTracking()
                    .Where(wh => wh.Id == data.WarehouseID)
                    .Select(wh => wh.MinInventory)
                    .FirstOrDefault();

                if (minimunStock > 0)
                {

                    var listUnconfirmSaleOrder = db.SalesOrders
                        .AsNoTracking()
                        .Where(x => x.IdWareHouse == data.WarehouseID && x.HandlingStatus == 1)
                        .ToList();

                    var currentGoodsStock = db.Goods
                        .AsNoTracking()
                        .Where(g => g.IdWareHouse == data.WarehouseID)
                        .Sum(g => g.Inventory);

                    var totalGoodsInUnconfirmSaleOrder = listUnconfirmSaleOrder
                        .SelectMany(order => order.DetailSaleOrders)
                        .GroupBy(detail => detail.IdGoods)
                        .Sum(group => group.Sum(detail => detail.Quantity));

                    var totalGoodsInCurrentSaleOrder = data.GoodsList
                        .GroupBy(good => good.Id)
                        .Sum(group => group.Sum(good => good.Qty));

                    if (currentGoodsStock - (totalGoodsInCurrentSaleOrder + totalGoodsInUnconfirmSaleOrder) < minimunStock)
                    {
                        return Json(new { code = 500, message = rm.GetString("warehouse_fw_create_note") });
                    }
                }
                string listSaleOrderWithThisGoods = "";
                bool isWrongCase = false;
                foreach (var item in data.GoodsList)
                {
                    var thisGoodsCurrentStock = db.Goods.AsNoTracking()
                                                        .Where(x => x.Id == item.Id && x.IdWareHouse == data.WarehouseID)
                                                        .Select(x => x.Inventory)
                                                        .FirstOrDefault();

                    var thisGoodsInOtherUnconfirmSaleOrder = db.SalesOrders.AsNoTracking()
                                                                           .Where(x => x.IdWareHouse == data.WarehouseID && x.HandlingStatus == 1)
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
                var result = await db.SaveChangesAsync();
                if (result <= 0)
                {
                    return Json(new { code = 500, message = rm.GetString("Tạo Phiếu Xuất Hàng Thất Bại").ToString() });
                }
                else
                {
                    return Json(new { code = 200, message = rm.GetString("Tạo Phiếu Xuất Hàng Thành Công").ToString() });
                }
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => $"{e.PropertyName}: {e.ErrorMessage}")
                    .ToList();

                var errorMessage = string.Join("; ", validationErrors);

                return Json(new { code = 500, message = $"Validation failed: {errorMessage}" });
            }
        }

        [HttpGet]
        public JsonResult StaffSaleOrder()
        {
            try
            {

                var c = (from b in db.Permissions.Where(x => x.Name_Permission == "Phiếu Yêu Cầu Xuất")
                         join p in db.User_Permission on b.Id equals p.ID_Permission
                         select new
                         {
                             id = b.Id,
                             name = p.User.Name,
                         }).ToList();
                return Json(new { code = 200, c = c, }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DeleteSO(string id)
        {
            try
            {
                var session = (User)Session["user"];
                if (!author.CheckPer("Xóa Phiếu Nhập", session)) { return Json(new { code = 500, message = "Bạn không có quyền xóa phiếu này" }); }
                var sale = db.SalesOrders.Find(id);
                if (sale == null)
                {
                    return Json(new { code = 500, message = rm.GetString("delivery_soID_error") });
                }
                else
                {
                    var deliveryTrue = db.Deliveries.Where(x => x.IdSalesOrder == id && (x.HandlingStatus == 2 || x.Status == true)).ToList();
                    if (deliveryTrue.Any())
                    {
                        return Json(new { code = 500, message = rm.GetString("delivery_exported_error") });
                    }
                    else
                    {
                        var detailSO = db.DetailSaleOrders.Where(x => x.IdSaleOrder == id).ToList();
                        var delivery = db.Deliveries.Where(x => x.IdSalesOrder == id).ToList();
                        if (delivery.Any())
                        {
                            foreach (var item in delivery)
                            {
                                var epcs = db.EPCs.Where(x => x.IdDelivery == item.Id && x.ExportStatus == false).ToList();
                                foreach (var e in epcs)
                                {
                                    e.IdDelivery = null;
                                    e.ExportStatus = null;
                                }

                                var listDelivery = db.DetailDeliveries.Where(x => x.IdDelivery == item.Id).ToList();
                                db.DetailDeliveries.RemoveRange(listDelivery);
                            }


                            db.Deliveries.RemoveRange(delivery);
                            db.DetailSaleOrders.RemoveRange(detailSO);
                        }
                        db.SalesOrders.Remove(sale);
                        db.SaveChanges();

                        return Json(new { code = 200, message = rm.GetString("SucessDelete") });
                    }
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }


        [HttpPost]
        public JsonResult ConfirmSaleOrder(string id)
        {
            var session = (User)Session["user"];
            var saleOrder = db.SalesOrders.Where(x => x.Id == id).FirstOrDefault();
            var saleOrderDetail = db.DetailSaleOrders.Where(x => x.IdSaleOrder == id).ToList();
            var delivery = db.Deliveries.Where(x => x.IdSalesOrder == id).ToList();
            var listDeliveryId = delivery.Select(x => x.Id).ToList();
            if (saleOrder != null && saleOrderDetail.Any() && delivery.Any())
            {
                foreach (var item in saleOrderDetail)
                {
                    var goodsInEpc = db.EPCs.Where(x => x.IdGoods == item.IdGoods && listDeliveryId.Contains(x.IdDelivery)).ToList();

                    var thisGoodsInListGoods = db.Goods.Where(x => x.Id == item.IdGoods && x.IdWareHouse == saleOrder.IdWareHouse).FirstOrDefault();
                    var thisGoodsInListDetailWareHouse = db.DetailWareHouses.Where(x => x.IdGoods == item.IdGoods && x.IdWareHouse == saleOrder.IdWareHouse).FirstOrDefault();

                    var countGoodsInEpc = goodsInEpc.Count();

                    var quantity = item.Quantity;

                    if (countGoodsInEpc == quantity)
                    {
                        item.Status = true;
                        item.QuantityScan = countGoodsInEpc;
                        item.ModifyDate = DateTime.Now;
                        item.ModifyBy = session.Name;
                    }
                    goodsInEpc.ForEach(x =>
                    {
                        x.ExportStatus = false;
                    });

                    thisGoodsInListGoods.Inventory -= countGoodsInEpc;
                    thisGoodsInListDetailWareHouse.Inventory -= countGoodsInEpc;
                }
                delivery.ForEach(x =>
                {
                    x.ModifyDate = DateTime.Now;
                    x.ModifyBy = session.Name;
                    x.Status = true;
                    x.HandlingStatus = 2;
                });
                saleOrder.Status = true;
                saleOrder.ModifyDate = DateTime.Now;
                saleOrder.ModifyBy = session.Name;

                db.SaveChanges();
            }
            else
            {
                return Json(new
                {
                    code = 500,
                    message = rm.GetString("process_error")
                });
            }
            return Json(new
            {
                code = 200,
                message = rm.GetString("approve_success")
            });
        }

        [HttpPost]
        public JsonResult ListGoodInWH(DataForm.pagination pagination, DataForm.Sort sort, query query)
        {
            try
            {
                if(query == null)
                    query = new query();
                query.GoodName = query.GoodName == null ? "" : query.GoodName;
                var search = query.generalSearch == null ? "" : query.generalSearch;
                var sortField = sort == null ? "Id" : (sort.field == null ? "Id" : sort.field);
                if (sort.field == "STT")
                {
                    sort.field = "Id";
                }

                var querys = db.DetailWareHouses.Where(d => d.IdWareHouse == search && d.Inventory > 0 && !d.IdGoods.Contains("J"));
                var sortedTable = sort.sort == "desc" ? querys.OrderBy($"{sortField} DESC") : querys.OrderBy(sortField);
                
                var goodMapping = db.Goods.ToDictionary(x => x.Id, x => x.Name);
                var unitGoodMapping = db.Goods.ToDictionary(x => x.Id, x => x.IdUnit);
                var unitMapping = db.Units.ToDictionary(x => x.Id, x => x.Name);
                var groupGoodMapping = db.Goods.ToDictionary(x => x.Id, x => x.IdGroupGood);
                var groupGoodNameMapping = db.GroupGoods.ToDictionary(x => x.Id, x => x.Name);
                var datas = sortedTable.ToList()
                            .Select((u, index) => new
                            {
                                STT = index + 1,
                                Id = u.IdGoods,
                                Name = goodMapping[u.IdGoods],
                                GroupGood = groupGoodMapping[u.IdGoods] != null ? groupGoodNameMapping[groupGoodMapping[u.IdGoods]] : "",
                                u.Inventory,
                                Unit = unitGoodMapping[u.IdGoods] != null ? unitMapping[unitGoodMapping[u.IdGoods]] : "",
                                Status = u.Status,
                                Identifier = u.Good.Identifier
                            })
                            .ToList().Where(x => x.Id.Contains(query.GoodName) || x.Name.ToLower().Contains(query.GoodName));
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
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message });
            }
        }

        [HttpGet]
        public JsonResult Detail(string idgood, string idwh)
        {
            try
            {
                db.Configuration.ProxyCreationEnabled = false;
                if (!string.IsNullOrEmpty(idgood) && !string.IsNullOrEmpty(idwh))
                {
                    var goodMapping = db.Goods.ToDictionary(x => x.Id, x => x.Name);
                    var unitGoodMapping = db.Goods.ToDictionary(x => x.Id, x => x.IdUnit);
                    var unitMapping = db.Units.ToDictionary(x => x.Id, x => x.Name);
                    var groupGoodMapping = db.Goods.ToDictionary(x => x.Id, x => x.IdGroupGood);
                    var groupGoodNameMapping = db.GroupGoods.ToDictionary(x => x.Id, x => x.Name);
                    var goodInWH = (from g in db.DetailWareHouses
                                    where g.IdGoods == idgood && g.IdWareHouse == idwh
                                    select new
                                    {
                                        g.IdGoods,
                                        g.Inventory
                                    })
                                   .AsEnumerable()  // Chuyển đổi sang truy vấn trong bộ nhớ
                                   .Select(g => new
                                   {
                                       g.IdGoods,
                                       Name = goodMapping.ContainsKey(g.IdGoods) ? goodMapping[g.IdGoods] : "",
                                       Unit = unitGoodMapping.ContainsKey(g.IdGoods) && !string.IsNullOrEmpty(unitGoodMapping[g.IdGoods]) && unitMapping.ContainsKey(unitGoodMapping[g.IdGoods])
                                           ? unitMapping[unitGoodMapping[g.IdGoods]] : "",
                                       GroupGood = groupGoodMapping.ContainsKey(g.IdGoods) && !string.IsNullOrEmpty(groupGoodMapping[g.IdGoods]) && groupGoodNameMapping.ContainsKey(groupGoodMapping[g.IdGoods])
                                           ? groupGoodNameMapping[groupGoodMapping[g.IdGoods]] : "",
                                       g.Inventory,
                                   })
                                   .FirstOrDefault();

                    if (goodInWH == null)
                    {
                        return Json(new { code = 500, msg = rm.GetString("mã hàng không tồn tại").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { code = 200, goodInWH }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("mã hàng không tồn tại").ToString() }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetNewSO()
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
                    int number;
                    if (TryParseToInt(numberPart,out number))
                    {
                        response = "SO" + temp + "-" + (number + 1).ToString("D5");
                    }
                    else
                    {
                        response = "SO" + temp + "-00001";
                    }
                }
                else
                    response = "SO" + temp + "-00001";
                return Json(new { code = 200, data = response }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }

        }

        public bool TryParseToInt(string input, out int number)
        {
            return int.TryParse(input, out number);
        }

        [HttpPost]
        public JsonResult GetPrintSOData(string idSO)
        {
            try
            {
                var getSO = db.SalesOrders.Where(x => x.Id == idSO)
                                          .Select(u => new
                                          {
                                              Id = u.Id,
                                              u.CreateDate,
                                              CustomerName = db.Customers.FirstOrDefault(x => x.Id == u.IdCustomer).Name,
                                              CustomerAddress = db.Customers.FirstOrDefault(x => x.Id == u.IdCustomer).AddRess,
                                              u.Description,
                                              Warehouse = db.WareHouses.FirstOrDefault(x => x.Id == u.IdWareHouse).Name,
                                          })
                                          .FirstOrDefault();
                if (getSO != null)
                {
                    var getDetailSO = db.DetailSaleOrders.Where(x => x.IdSaleOrder == idSO)
                                                         .Select(u => new
                                                         {
                                                             u.IdGoods,
                                                             GoodName = db.Goods.FirstOrDefault(x => x.Id == u.IdGoods).Name,
                                                             Unit = db.Units.FirstOrDefault(x => x.Id == db.Goods.FirstOrDefault(k => k.Id == u.IdGoods).IdUnit).Name,
                                                             u.Quantity,
                                                             u.QuantityScan
                                                         })
                                                         .ToList();

                    return Json(new { code = 200, getSO, getDetailSO });
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("sale_noexist") });
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpPost]
        public JsonResult UpdateLayoutPrintBill(HttpPostedFileBase img, string data)
        {
            try
            {
                if (img != null && img.ContentLength > 0)
                {
                    // Đường dẫn đến file đích (ví dụ: logo trong thư mục printBill)
                    var directoryPath = Server.MapPath("~/PrintDetail");
                    var filePath = Path.Combine(directoryPath, "logo-bill.png"); // Đặt tên file là logo.png

                    // Đảm bảo thư mục tồn tại
                    if (!Directory.Exists(directoryPath))
                    {
                        Directory.CreateDirectory(directoryPath);
                    }

                    // Ghi đè file
                    img.SaveAs(filePath);
                }

                if (!string.IsNullOrEmpty(data))
                {
                    var getUpdateData = JsonConvert.DeserializeObject<List<Dictionary<string, string>>>(data);
                    // Tạo nội dung mới cho file JS
                    string jsContent = $"var dataSOBill = {JsonConvert.SerializeObject(getUpdateData, Formatting.Indented)};";

                    // Đường dẫn tới file cần ghi đè (cập nhật đường dẫn theo dự án của bạn)
                    string filePath = Server.MapPath("~/PrintDetail/SOBill.js");

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
    public class SaleOrderRequestDto
    {
        private string _idSO;
        public string IdSO
        {
            get => _idSO;
            set => _idSO = value?.Trim();
        }

        private string _warehouseID;
        public string WarehouseID
        {
            get => _warehouseID;
            set => _warehouseID = value?.Trim();
        }

        public int HandlingStatusID { get; set; }

        private string _note;
        public string Note
        {
            get => _note;
            set => _note = value?.Trim();
        }

        private string _customerName;
        public string CustomerName
        {
            get => _customerName;
            set => _customerName = value?.Trim();
        }

        public List<GoodsDtoRequest> GoodsList { get; set; }
    }

    public class GoodsDtoRequest
    {
        public int No { get; set; }

        private string _id;
        public string Id
        {
            get => _id;
            set => _id = value?.Trim();
        }

        private string _name;
        public string Name
        {
            get => _name;
            set => _name = value?.Trim();
        }

        public double? Qty { get; set; }

        private string _unit;
        public string Unit
        {
            get => _unit;
            set => _unit = value?.Trim();
        }
    }

    public class GoodsDto
    {
        private string _id;
        public string Id
        {
            get => _id;
            set => _id = value?.Trim();
        }

        private string _name;
        public string Name
        {
            get => _name;
            set => _name = value?.Trim();
        }

        public double? Inventory { get; set; }

        private string _idUnit;
        public string IdUnit
        {
            get => _idUnit;
            set => _idUnit = value?.Trim();
        }
    }

    public class GoodEPC
    {
        private string _idEPC;
        public string IdEPC
        {
            get => _idEPC;
            set => _idEPC = value?.Trim();
        }

        private string _idGoods;
        public string IdGoods
        {
            get => _idGoods;
            set => _idGoods = value?.Trim();
        }

        private string _idSerial;
        public string IdSerial
        {
            get => _idSerial;
            set => _idSerial = value?.Trim();
        }
    }

    public class SaleOrderResponseDto
    {
        public int STT { get; set; }

        private string _saleOrderId;
        public string SaleOrderId
        {
            get => _saleOrderId;
            set => _saleOrderId = value?.Trim();
        }

        private string _warehouseName;
        public string WarehouseName
        {
            get => _warehouseName;
            set => _warehouseName = value?.Trim();
        }

        private string _scanStatus;
        public string ScanStatus
        {
            get => _scanStatus;
            set => _scanStatus = value?.Trim();
        }

        private string _createDate;
        public string CreateDate
        {
            get => _createDate;
            set => _createDate = value?.Trim();
        }

        private string _customerName;
        public string CustomerName
        {
            get => _customerName;
            set => _customerName = value?.Trim();
        }

        public int? HandlingStatus { get; set; }
        public bool? Status { get; set; }
    }

    public class query
    {
        private string _tungay;
        public string tungay
        {
            get => _tungay;
            set => _tungay = value?.Trim();
        }

        private string _denngay;
        public string denngay
        {
            get => _denngay;
            set => _denngay = value?.Trim();
        }

        private string _warehouseName;
        public string WarehouseName
        {
            get => _warehouseName;
            set => _warehouseName = value?.Trim();
        }

        private string _scanStatus;
        public string ScanStatus
        {
            get => _scanStatus;
            set => _scanStatus = value?.Trim();
        }

        private string _generalSearch;
        public string generalSearch
        {
            get => _generalSearch;
            set => _generalSearch = value?.Trim();
        }

        private string _goodName;
        public string GoodName
        {
            get => _goodName;
            set => _goodName = value?.Trim();
        }
    }

    public class SOResponseData
    {
        public int No { get; set; }

        private string _id;
        public string id
        {
            get => _id;
            set => _id = value?.Trim();
        }

        private string _idwarehouse;
        public string idwarehouse
        {
            get => _idwarehouse;
            set => _idwarehouse = value?.Trim();
        }

        private string _idPuchaseOrder;
        public string idPuchaseOrder
        {
            get => _idPuchaseOrder;
            set => _idPuchaseOrder = value?.Trim();
        }

        private string _namewarehouse;
        public string namewarehouse
        {
            get => _namewarehouse;
            set => _namewarehouse = value?.Trim();
        }

        public DateTime? createdate { get; set; }

        private string _namecustomer;
        public string namecustomer
        {
            get => _namecustomer;
            set => _namecustomer = value?.Trim();
        }

        private string _status;
        public string status
        {
            get => _status;
            set => _status = value?.Trim();
        }

        private string _handlingStatus;
        public string handlingStatus
        {
            get => _handlingStatus;
            set => _handlingStatus = value?.Trim();
        }

        public DateTime? deliveryDate { get; set; }

        private string _createBy;
        public string createBy
        {
            get => _createBy;
            set => _createBy = value?.Trim();
        }

        public int? typeStatus { get; set; }
        public string description { get; set; }
    }

}