using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Resources;
using System.Web;
using System.Web.Mvc;
using WMS.Controllers;
using WMS.Models;
using System.Data.Entity;

namespace WMS.Areas.WarehouseManagement.Controllers
{
    public class DeliveryController : BaseController
    {
        private WMSEntities db = new WMSEntities();
        private AuthorizationController author = new AuthorizationController();
        ResourceManager rm = new ResourceManager("WMS.App_GlobalResources.Resource", typeof(Resources.Resource).Assembly);
        // GET: Delivery
        public ActionResult Index()
        {
            return View();
        }
        [HttpPost]
        public JsonResult Add(int statusSave, string id, string idSaleOrder, string Des, string ArraySales, string ArrayEPC)
        {
            try
            {
                if (!string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(idSaleOrder))
                {
                    var session = (User)Session["user"];
                    var salesOrder = db.SalesOrders.Find(idSaleOrder);
                    var existingDelivery = db.Deliveries.Find(id);
                    var idwarehouse = salesOrder.IdWareHouse;
                    var InventoryStatus = db.ModelSettings.Find("inventorystatus").Status;
                    var detailSaleOrder = JsonConvert.DeserializeObject<DetailSaleOrder[]>(ArraySales);
                    var epcs = JsonConvert.DeserializeObject<string[]>(ArrayEPC);
                    // lưu vào delivery
                    if (existingDelivery == null)
                    {
                        var newDelivery = new Delivery
                        {
                            Id = id,
                            IdSalesOrder = idSaleOrder,
                            CreateDate = DateTime.Now,
                            ModifyDate = DateTime.Now,
                            Description = Des == "" ? null : Des,
                            CreateBy = session.Name,
                            ModifyBy = session.Name,
                            Status = statusSave == 1 ? true : false,
                        };
                        db.Deliveries.Add(newDelivery);
                        var listDeliveryFalse = db.Deliveries.Where(x => x.IdSalesOrder == idSaleOrder).ToList();
                        if (statusSave == 1)
                        {
                            foreach (var item in listDeliveryFalse)
                            {
                                item.Status = true;
                            }
                        }
                        // đổi status trong delivery thành true
                        if (salesOrder != null)
                        {
                            salesOrder.Status = statusSave == 1 ? true : false;
                        }
                        else
                        {
                            return Json(new { status = 500, msg = rm.GetString("Mã Phiếu Xuất Không Tồn Tại").ToString() }, JsonRequestBehavior.AllowGet);
                        }
                        // Cập nhật DetailSaleOrder
                        var idgoods = "";
                        foreach (var detail in detailSaleOrder)
                        {

                            var de = db.DetailSaleOrders.SingleOrDefault(d => d.SalesOrder.IdWareHouse == idwarehouse && d.IdSaleOrder == idSaleOrder && d.IdGoods == detail.IdGoods);
                            if (de == null)
                            {
                                return Json(new { status = 500, msg = rm.GetString("Mã Hàng Trong Danh Sách Chưa Có Trong Phiếu Xuất").ToString() }, JsonRequestBehavior.AllowGet);
                            }
                            else
                            {
                                idgoods = detail.IdGoods;
                                var qtyScanned = detail.QuantityScan - (de.QuantityScan == null ? 0 : de.QuantityScan);
                                var dew = db.DetailWareHouses
                               .SingleOrDefault(d => d.IdWareHouse == idwarehouse && d.IdGoods == detail.IdGoods);
                                if (dew != null)
                                {
                                    if (InventoryStatus == true)
                                    {
                                        var goods = db.Goods.Find(detail.IdGoods);
                                        if (goods != null)
                                        {
                                            goods.Inventory -= qtyScanned;
                                        }
                                        dew.Inventory -= qtyScanned;
                                    }
                                    de.IdDelivery = id;
                                    de.QuantityScan = detail.QuantityScan;
                                    de.Status = statusSave == 1 ? true : false;
                                    de.ModifyDate = DateTime.Now;
                                    de.ModifyBy = session.Name;
                                }
                            }
                        }
                        foreach (var epc in epcs)
                        {
                            var e = db.EPCs.FirstOrDefault(d => d.IdEPC == epc && d.IdWareHouse == idwarehouse && d.Status == true);
                            if (e == null)
                            {
                                return Json(new { status = 500, c = idgoods, msg = rm.GetString("Mã Hàng") + idgoods + rm.GetString("Có Mã EPC Là") + epc + rm.GetString("Không Tồn Tại") }, JsonRequestBehavior.AllowGet);
                            }
                            else
                            {
                                db.EPCs.Remove(e);
                            }
                        }
                        db.SaveChanges();
                    }
                    else
                    {
                        return Json(new { status = 500, msg = rm.GetString("Mã Phiếu Xuất Đã Tồn Tại").ToString() }, JsonRequestBehavior.AllowGet);
                    }
                    return Json(new { status = 200, msg = rm.GetString("Lưu Thành Công").ToString() }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { status = 500, msg = rm.GetString("Nhập Đủ Số Phiếu Xuất").ToString() }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { status = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }

        }

        //[HttpPost]
        //public JsonResult Delete(string id)
        //{
        //    try
        //    {

        //        db.Configuration.ProxyCreationEnabled = false;
        //        var d = db.Deliveries.Where(x => x.IdSalesOrder == id).ToList();
        //        db.Deliveries.RemoveRange(d);
        //        db.SaveChanges();
        //        return Json(new { code = 200, msg = rm.GetString("SucessDelete") }, JsonRequestBehavior.AllowGet);

        //    }
        //    catch (Exception)
        //    {
        //        return Json(new { code = 500, msg = rm.GetString("SucessEdit") }, JsonRequestBehavior.AllowGet);
        //    }
        //}

        //[HttpPost]
        //public JsonResult DeleteDelivery(string id)
        //{
        //    try
        //    {
        //        var getDelivery = db.Deliveries.FirstOrDefault(d => d.Id == id);
        //        if (getDelivery != null)
        //        {
        //            if (getDelivery.HandlingStatus == 2)
        //            {
        //                return Json(new { code = 500, msg = rm.GetString("scan_form_approve_delete") });
        //            }
        //            var listEPC = db.EPCs.Where(x => x.IdDelivery == id).ToList();
        //            var count = listEPC.Count();

        //            foreach (var e in listEPC)
        //            {
        //                var getGoodInDSO = db.DetailSaleOrders.Where(d => d.IdSaleOrder == getDelivery.IdSalesOrder && d.IdGoods == e.IdGoods).FirstOrDefault();
        //                if (getGoodInDSO != null)
        //                {
        //                    getGoodInDSO.QuantityScan -= 1;
        //                    if (getGoodInDSO.QuantityScan == 0)
        //                    {
        //                        getGoodInDSO.QuantityScan = null;
        //                    }
        //                }
        //                e.IdDelivery = null;
        //                e.ExportStatus = null;
        //            }

        //            var SO = db.SalesOrders.FirstOrDefault(x => x.Id == getDelivery.IdSalesOrder);
        //            if (SO != null)
        //            {
        //                SO.Status = false;
        //            }

        //            var listDetailDeli = db.DetailDeliveries.Where(x => x.IdDelivery == id).ToList();
        //            db.DetailDeliveries.RemoveRange(listDetailDeli);

        //            db.Deliveries.Remove(getDelivery);
        //            db.SaveChanges();
        //            return Json(new { code = 200, msg = rm.GetString("SucessDelete") });
        //        }
        //        else
        //        {
        //            return Json(new { code = 500, msg = rm.GetString("reciept_noID_error") });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
        //    }
        //}

        [HttpPost]
        public JsonResult DeleteDelivery(string id)
        {
            try
            {
                var getDelivery = db.Deliveries.FirstOrDefault(d => d.Id == id);
                if (getDelivery != null)
                {
                    if (getDelivery.HandlingStatus == 2)
                    {
                        return Json(new { code = 500, msg = rm.GetString("scan_form_approve_delete") });
                    }
                    var getListDelivery = db.DetailDeliveries.Where(x => x.IdDelivery == getDelivery.Id).ToList();

                    foreach (var e in getListDelivery)
                    {
                        var getGoodInDSO = db.DetailSaleOrders.Where(d => d.IdSaleOrder == getDelivery.IdSalesOrder && d.IdGoods == e.IdGood).FirstOrDefault();
                        if (getGoodInDSO != null)
                        {
                            getGoodInDSO.QuantityScan -= e.QuantityScan;
                            if (getGoodInDSO.QuantityScan == 0)
                            {
                                getGoodInDSO.QuantityScan = null;
                            }
                        }
                    }

                    var SO = db.SalesOrders.FirstOrDefault(x => x.Id == getDelivery.IdSalesOrder);
                    if (SO != null)
                    {
                        SO.Status = false;
                    }

                    db.DetailDeliveries.RemoveRange(getListDelivery);
                    db.Deliveries.Remove(getDelivery);
                    db.SaveChanges();
                    return Json(new { code = 200, msg = rm.GetString("SucessDelete") });
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("reciept_noID_error") });
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }

        [HttpGet]
        public JsonResult Last(string id)
        {
            try
            {
                var a = (from b in db.Deliveries.Where(x => x.Id == id)
                         select new { id = b.Id, datepx = b.CreateDate.Value.Day + "/" + b.CreateDate.Value.Month + "/" + b.CreateDate.Value.Year }).ToList();
                return Json(new { code = 200, a = a }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        //[HttpPost]
        //public JsonResult SaveDelivery(OrderRequest request)
        //{
        //    var user = (User)Session["user"];
        //    if (request == null)
        //    {
        //        return Json(new
        //        {
        //            code = 500,
        //            message = rm.GetString("data_no")
        //        });
        //    }
        //    if (request.ArrayEPC == null)
        //    {
        //        return Json(new
        //        {
        //            code = 500,
        //            message = rm.GetString("receipt_noDataScan_error")
        //        });
        //    }
        //    using (var transaction = db.Database.BeginTransaction())
        //    {
        //        try
        //        {
        //            var wareHouseMapping = db.WareHouses.ToDictionary(x => x.Name, x => x.Id);
        //            var delivery = new Delivery
        //            {
        //                Id = request.Id,
        //                IdSalesOrder = request.SaleOrderId,
        //                IdWareHouse = !string.IsNullOrEmpty(request.WarehouseName) ? wareHouseMapping[request.WarehouseName] : "",
        //                Description = request.Note,
        //                CreateDate = DateTime.Now,
        //                CreateBy = user.Name,
        //                Status = false,
        //                HandlingStatus = 1,
        //            };
        //            db.Deliveries.Add(delivery);
        //            var listGoodInDetail = new List<DetailDelivery>();

        //            foreach (var item in request.ArrayEPC)
        //            {
        //                var getEPC = db.EPCs.FirstOrDefault(x => x.IdEPC == item.IdEPC && x.IdGoods == item.IdGoods && x.Status == true && x.IdDelivery == null && x.ExportStatus == null && x.IdSerial == item.IdSerial);

        //                if (getEPC != null)
        //                {
        //                    var getDetailSOGood = db.DetailSaleOrders.FirstOrDefault(x => x.IdGoods == getEPC.IdGoods && x.IdSaleOrder == request.SaleOrderId);
        //                    if (getDetailSOGood != null)
        //                    {
        //                        var getGood = listGoodInDetail.FirstOrDefault(x => x.IdGood == getEPC.IdGoods && x.IdDelivery == request.Id);
        //                        //var detailDelivery = db.DetailDeliveries.FirstOrDefault(x => x.IdGood == getEPC.IdGoods && x.IdDelivery == request.Id);
        //                        if (getGood == null)
        //                        {
        //                            var newDetailDeli = new DetailDelivery()
        //                            {
        //                                IdGood = getEPC.IdGoods,
        //                                IdDelivery = request.Id,
        //                                Quantity = getDetailSOGood.Quantity,
        //                                QuantityScan = 1,
        //                                Status = true,
        //                                CreateBy = user.Name,
        //                                CreateDate = DateTime.Now,
        //                                ModifyBy = user.Name,
        //                                ModifyDate = DateTime.Now,
        //                            };

        //                            listGoodInDetail.Add(newDetailDeli);
        //                        }
        //                        else
        //                        {
        //                            getGood.QuantityScan += 1;
        //                        }


        //                        if (getDetailSOGood.QuantityScan == null)
        //                        {
        //                            getDetailSOGood.QuantityScan = 1;
        //                        }
        //                        else
        //                        {
        //                            getDetailSOGood.QuantityScan += 1;
        //                        }
        //                    }

        //                    getEPC.IdDelivery = request.Id;
        //                    getEPC.ExportStatus = false;
        //                    db.SaveChanges();
        //                }
        //            }

        //            db.DetailDeliveries.AddRange(listGoodInDetail);

        //            var listDSO = db.DetailSaleOrders.Where(x => x.IdSaleOrder == request.SaleOrderId).ToList();
        //            var total = listDSO.Count();
        //            var count = 0;
        //            foreach (var item in listDSO)
        //            {
        //                if (item.QuantityScan == item.Quantity)
        //                {
        //                    count += 1;
        //                }
        //            }

        //            if (count == total)
        //            {
        //                var getSO = db.SalesOrders.FirstOrDefault(x => x.Id == request.SaleOrderId);
        //                if (getSO != null)
        //                {
        //                    getSO.Status = true;
        //                }

        //            }
        //            db.SaveChanges();
        //            transaction.Commit();

        //            return Json(new
        //            {
        //                code = 200,
        //                message = rm.GetString("scan_add_successfully")
        //            });
        //        }
        //        catch (Exception ex)
        //        {
        //            transaction.Rollback();

        //            return Json(new
        //            {
        //                code = 500,
        //                message = rm.GetString("error") + ": " + ex.Message
        //            });
        //        }
        //    }
        //}

        [HttpPost]
        public JsonResult SaveDelivery(OrderRequest request)
        {
            var user = (User)Session["user"];
            if (request == null)
            {
                return Json(new
                {
                    code = 500,
                    message = rm.GetString("data_no")
                });
            }
            if (request.ArrayEPC == null)
            {
                return Json(new
                {
                    code = 500,
                    message = rm.GetString("receipt_noDataScan_error")
                });
            }
            using (var transaction = db.Database.BeginTransaction())
            {
                try
                {
                    var wareHouseMapping = db.WareHouses.ToDictionary(x => x.Name, x => x.Id);
                    var delivery = new Delivery
                    {
                        Id = request.Id,
                        IdSalesOrder = request.SaleOrderId,
                        IdWareHouse = !string.IsNullOrEmpty(request.WarehouseName) ? wareHouseMapping[request.WarehouseName] : "",
                        Description = request.Note,
                        CreateDate = DateTime.Now,
                        CreateBy = user.Name,
                        Status = false,
                        HandlingStatus = 1,
                    };
                    db.Deliveries.Add(delivery);
                    var listGoodInDetail = new List<DetailDelivery>();

                    foreach (var item in request.ArrayEPC)
                    {
                        var idWH = wareHouseMapping[request.WarehouseName];
                        var checkGoods = db.DetailWareHouses.FirstOrDefault(x => x.IdWareHouse == idWH && x.IdGoods == item.IdGoods);
                        if (checkGoods != null)
                        {
                            var totalQuantity = (from a in db.Deliveries
                                                 join b in db.DetailDeliveries on a.Id equals b.IdDelivery
                                                 where a.IdWareHouse == checkGoods.IdWareHouse
                                                    && b.IdGood == checkGoods.IdGoods
                                                    && b.Status != true
                                                 select b.QuantityScan).Sum();
                            if ((checkGoods.Inventory - totalQuantity) < item.Quantity)
                            {
                                return Json(new
                                {
                                    code = 500,
                                    message = rm.GetString("quantity_export") + " " + checkGoods.IdGoods + " " + rm.GetString("currently_not_enough")
                                });
                            }
                        }
                        else
                        {
                            return Json(new
                            {
                                code = 500,
                                message = rm.GetString("goods_with_id") + " " + checkGoods.IdGoods + " " + rm.GetString("not_exists_in_system")
                            });
                        }
                        var getDetailSOGood = db.DetailSaleOrders.FirstOrDefault(x => x.IdGoods == item.IdGoods && x.IdSaleOrder == request.SaleOrderId);
                        if (getDetailSOGood != null)
                        {
                            var getGood = listGoodInDetail.FirstOrDefault(x => x.IdGood == item.IdGoods && x.IdDelivery == request.Id);
                            //var detailDelivery = db.DetailDeliveries.FirstOrDefault(x => x.IdGood == getEPC.IdGoods && x.IdDelivery == request.Id);
                            if (getGood == null)
                            {
                                var newDetailDeli = new DetailDelivery()
                                {
                                    IdGood = item.IdGoods,
                                    IdDelivery = request.Id,
                                    Quantity = getDetailSOGood.Quantity,
                                    QuantityScan = item.Quantity,
                                    Status = false,
                                    CreateBy = user.Name,
                                    CreateDate = DateTime.Now,
                                    ModifyBy = user.Name,
                                    ModifyDate = DateTime.Now,
                                };

                                listGoodInDetail.Add(newDetailDeli);
                            }
                            else
                            {
                                getGood.QuantityScan = item.Quantity;
                            }


                            if (getDetailSOGood.QuantityScan == null)
                            {
                                getDetailSOGood.QuantityScan = item.Quantity;
                            }
                            else
                            {
                                getDetailSOGood.QuantityScan += item.Quantity;
                            }
                        }
                        db.SaveChanges();
                    }

                    db.DetailDeliveries.AddRange(listGoodInDetail);

                    var listDSO = db.DetailSaleOrders.Where(x => x.IdSaleOrder == request.SaleOrderId).ToList();
                    var total = listDSO.Count();
                    var count = 0;
                    foreach (var item in listDSO)
                    {
                        if (item.QuantityScan == item.Quantity)
                        {
                            count += 1;
                        }
                    }

                    if (count == total)
                    {
                        var getSO = db.SalesOrders.FirstOrDefault(x => x.Id == request.SaleOrderId);
                        if (getSO != null)
                        {
                            getSO.Status = true;
                        }

                    }
                    db.SaveChanges();
                    transaction.Commit();

                    return Json(new
                    {
                        code = 200,
                        message = rm.GetString("scan_add_successfully")
                    });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();

                    return Json(new
                    {
                        code = 500,
                        message = rm.GetString("error") + ": " + ex.Message
                    });
                }
            }
        }

        [HttpGet]
        public JsonResult GetDetailDelivery(string id)
        {
            try
            {

                return Json(new { code = 200 });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message });
            }
        }


        [HttpPost]
        public ActionResult GetDeliveryBySaleOrderId(string SaleOrderId)
        {
            try
            {
                var listData = db.Deliveries
                    .AsNoTracking()
                    .Where(x => x.IdSalesOrder == SaleOrderId)
                    .ToList()
                    .Select((x, index) => new DeliveryResponseDto
                    {
                        STT = index + 1,
                        Id = x.IdSalesOrder,
                        Description = x.Description,
                        CreateDate = x.CreateDate.HasValue ? x.CreateDate.Value.ToString("dd/MM/yyyy") : null,
                        DeliveryId = x.Id
                    })
                    .ToList();

                return Json(new
                {
                    code = 200,
                    data = listData
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    code = 500,
                    message = "An error occurred: " + ex.Message
                });
            }
        }

        [HttpPost]
        public ActionResult CountScannedGoodsInADelivery(string id)
        {
            try
            {
                var goodMapping = db.Goods.ToDictionary(x => x.Id, x => x.Name);
                var getDelivery = db.Deliveries.FirstOrDefault(d => d.Id == id);
                if (getDelivery != null)
                {

                    var getDetailDeli = db.DetailDeliveries.Where(x => x.IdDelivery == id)
                                                           .ToList()
                                                           .Select((d) => new
                                                           {
                                                               IdGood = d.IdGood,
                                                               GoodName = goodMapping[d.IdGood],
                                                               Quantity = d.Quantity,
                                                               QuantityScan = d.QuantityScan
                                                           })
                                                           .ToList();

                    return Json(new
                    {
                        code = 200,
                        data = getDetailDeli
                    });
                    //var SaleOrderId = getDelivery.IdSalesOrder;

                    //var listData = db.DetailSaleOrders
                    //.AsNoTracking()
                    //.Where(x => x.IdSaleOrder == SaleOrderId)
                    //.Include(x => x.Good)
                    //.ToList()
                    //.Select((x, index) => new DeliveryScanDetailResponseDto
                    //{
                    //    STT = index + 1,
                    //    IdGoods = x.Good.Id,
                    //    GoodName = x.Good.Name,
                    //    Quantity = x.Quantity
                    //})
                    //.ToList();

                    //foreach (var item in listData)
                    //{
                    //    var countGood = db.EPCs.Where(x => x.IdDelivery == id && x.IdGoods == item.IdGoods).ToList().Count();
                    //    item.QuantityScan = countGood;
                    //}

                    //return Json(new
                    //{
                    //    code = 200,
                    //    data = listData
                    //});
                }
                else
                {
                    return Json(new { code = 500, msg = rm.GetString("scan_ID_error") });
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    code = 500,
                    msg = "An error occurred: " + ex.Message
                });
            }
        }

        [HttpPost]
        public ActionResult CountScannedSurplusGoodsInADelivery(string SaleOrderId)
        {
            try
            {
                var listData = db.DetailSaleOrders
                    .AsNoTracking()
                    .Where(x => x.IdSaleOrder == SaleOrderId)
                    .Include(x => x.Good)
                    .ToList()
                    .Select(x =>
                    new
                    {
                        IdGoods = x.Good.Id,
                    })
                    .ToList();

                var listDataDelivery = db.Deliveries
                    .AsNoTracking()
                    .Where(x => x.IdSalesOrder == SaleOrderId)
                    .ToList()
                    .Select(x =>
                    new
                    {
                        Id = x.Id,
                    })
                    .ToList();

                var listDataIds = listData.Select(x => x.IdGoods).ToList();
                var listDataDeliveryIds = listDataDelivery.Select(x => x.Id).ToList();
                var countGood = db.EPCs
                    .Where(x => listDataDeliveryIds.Contains(x.IdDelivery) && !listDataIds.Contains(x.IdGoods))
                    .Include(x => x.WareHouse)
                    .GroupBy(x => new { x.IdGoods, x.WareHouse.Name })
                    .Select(g => new
                    {
                        IdGoods = g.Key.IdGoods,
                        Count = g.Count(),
                        WarehouseName = g.Key.Name
                    }).ToList();

                return Json(new
                {
                    code = 200,
                    data = countGood
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    code = 500,
                    message = "An error occurred: " + ex.Message
                });
            }
        }

        [HttpPost]
        public JsonResult ApproveDelivery(List<string> ids)
        {
            try
            {
                var session = (User)Session["user"];
                if (ids == null)
                {
                    return Json(new { code = 500, msg = rm.GetString("approve_none") });
                }
                if (ids.Count() == 0)
                {
                    return Json(new { code = 500, msg = rm.GetString("approve_none") });
                }
                foreach (var id in ids)
                {
                    var delivery = db.Deliveries.FirstOrDefault(x => x.Id == id);
                    if (delivery != null && delivery.Status == false && delivery.HandlingStatus == 1)
                    {
                        var getDetailDelivery = db.DetailDeliveries.Where(x => x.IdDelivery == delivery.Id).ToList();
                        foreach (var detail in getDetailDelivery)
                        {
                            //var getAllDetailPO = db.DetailGoodOrders.Where(x => x.IdGoods == detail.IdGood && x.CurrentQuantity != null && x.CurrentQuantity > 0).OrderBy(x => x.CreateDate).ToList();
                            //var quantitySubtract = detail.QuantityScan;
                            //foreach (var dpo in getAllDetailPO)
                            //{
                            //    if(dpo.CurrentQuantity < quantitySubtract)
                            //    {
                            //        quantitySubtract -= dpo.CurrentQuantity;
                            //        dpo.CurrentQuantity = 0;
                            //    }
                            //    else
                            //    {
                            //        dpo.CurrentQuantity -= quantitySubtract;
                            //        quantitySubtract = 0;
                            //    }

                            //    if(quantitySubtract == 0)
                            //    {
                            //        break;
                            //    }
                            //}
                            var getWH = db.DetailWareHouses.FirstOrDefault(x => x.IdWareHouse == delivery.IdWareHouse && x.IdGoods == detail.IdGood);
                            getWH.Inventory -= detail.QuantityScan;
                            var getGood = db.Goods.FirstOrDefault(x => x.Id == detail.IdGood);
                            getGood.Inventory -= detail.QuantityScan;
                            detail.Status = true;
                        }
                        delivery.HandlingStatus = 2;
                        delivery.Status = true;

                        db.SaveChanges();
                    }
                }
                return Json(new { code = 200, msg = rm.GetString("approve_success") });
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message });
            }
        }
    }

    public class OrderRequest
    {
        public string Id { get; set; }
        public string SaleOrderId { get; set; }
        public string DeliveryDate { get; set; }
        public string CustomerName { get; set; }
        public string WarehouseName { get; set; }
        public string User { get; set; }
        public string Note { get; set; }
        public List<ScannedDataSO> ArrayEPC { get; set; }
    }

    public class ScannedDataSO
    {
        public string IdGoods { get; set; }
        public string Status { get; set; }
        public int Quantity { get; set; }
    }

    public class DeliveryResponseDto
    {
        public int STT { get; set; }
        public string Id { get; set; }
        public string DeliveryId { get; set; }
        public string Description { get; set; }
        public string CreateDate { get; set; }
    }

    public class DeliveryScanDetailResponseDto
    {
        public int STT { get; set; }
        public string IdGoods { get; set; }
        public string GoodName { get; set; }
        public int QuantityScan { get; set; }
        public double? Quantity { get; set; }
    }
}