using Google.Apis.Drive.v3.Data;
using iText.Kernel.Geom;
using Microsoft.Identity.Client;
using Microsoft.SqlServer.Management.Smo;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Drawing.Printing;
using System.Globalization;
using System.Linq;
using System.Resources;
using System.Web;
using System.Web.Mvc;
using WMS.Models;


namespace WMS.Controllers
{
    public class HomeController : BaseController
    {
        private ResourceManager rm = new ResourceManager("WMS.App_GlobalResources.Resource", typeof(Resources.Resource).Assembly);
        private WMSEntities db = new WMSEntities();
     

        public ActionResult About()
        {
            return View();
        }

        //Chính
        public ActionResult Index()
        {
            ///--
            var c = (Models.User)Session["user"];
            SesionUser s = new SesionUser();
            s.InventoryNotification();
            s.PurchaseNotification();
            s.SaleOrderNotification();
            //var rfid = new RFID();
            //rfid.Subscribe();
            //rfid.StartReadingTag();
            return View();

            //var c = (User)Session["user"];
            //Chat MC = new Chat();
            //// Check if the event is already subscribed
            //if (!MC.IsSqlDepEventSubscribed)
            //{f
            //    MC.RegisterNotification(c.Id);
            //}
            //SesionUser s = new SesionUser();
            //// Check if the event is already subscribed
            //if (!s.IsSqlDepEventSubscribed)
            //{
            //    s.RegisterNotification();
            //}
            //return View();
        }
        //Phụ
        /*public ActionResult Index()
        {
            //var c = (ApiAccount)Session["user"];
            //return View(c);


            return View();
        }*/
        public ActionResult Logout()
        {
            Session.Remove("user");
            //Session.Abandon();
            return RedirectToAction("Login", "Login");
        }

        [HttpGet]
        public JsonResult UserSession()
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.Name;
                // hiển thị tên máy chủ và tên csdl
                var server = "Không Có Kết Nối";
                var database = "Không Có Kết Nối";
                string connectionString = ConfigurationManager.ConnectionStrings["WMSEntities"].ConnectionString;
                EntityConnectionStringBuilder entityBuilder = new EntityConnectionStringBuilder(connectionString);
                server = new SqlConnectionStringBuilder(entityBuilder.ProviderConnectionString).DataSource;
                database = new SqlConnectionStringBuilder(entityBuilder.ProviderConnectionString).InitialCatalog;
                return Json(new { code = 200, username, server, database }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = "Lỗi !!!" + ex.Message }, JsonRequestBehavior.AllowGet); ;

            }
            //try
            //{
            //    var c = (User)Session["user"];
            //    var server = "Không có kết nối";
            //    var database = "Không có kết nối";
            //    string loginTime = QueryDateVsTime.Date(c.LoginTime.Value);
            //    string connectionString = ConfigurationManager.ConnectionStrings["WMSEntities"].ConnectionString;
            //    EntityConnectionStringBuilder entityBuilder = new EntityConnectionStringBuilder(connectionString);
            //    // Hiển thị tên máy chủ và tên cơ sở dữ liệu
            //    server = new SqlConnectionStringBuilder(entityBuilder.ProviderConnectionString).DataSource;
            //    database = new SqlConnectionStringBuilder(entityBuilder.ProviderConnectionString).InitialCatalog;
            //    return Json(new { code = 200, loginTime = loginTime, user = c.User1, server, database, email = c.Email }, JsonRequestBehavior.AllowGet);
            //}
            //catch (Exception e)
            //{
            //    return Json(new { code = 500, msg = "Lỗi !!!" + e.Message }, JsonRequestBehavior.AllowGet); ;
            //}
        }

        [HttpGet]
        public JsonResult GetTop3()
        {
            try
            {
                var topList = db.DetailSaleOrders
                    .GroupBy(x => x.IdGoods)
                    .Select(s => new
                    {
                        id = s.Key,
                        total = s.Sum(t => t.QuantityScan)
                    })
                    .OrderByDescending(x => x.total)
                    .Take(3)
                    .ToList();
                var topGoods = topList
                    .Join(db.Goods,
                          top => top.id,           // Key from topList
                          goods => goods.Id,       // Key from Goods table
                          (top, goods) => new      // Result projection
                          {
                              Id = top.id,
                              name = goods.Name,   // Name from Goods table
                              total = top.total    // Total from topList
                          })
                    .ToList();

                return Json(new { code = 200, topGoods }, JsonRequestBehavior.AllowGet);
            }
            catch(Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult PurchaseNotify()
        {
            try
            {
                var purchases = db.PurchaseOrders.ToList();
                var notifies = db.PurchaseNotifies.ToList();

                foreach (var purchase in purchases)
                {
                    var idPurchase = purchase.Id;
                    var status = purchase.Status;

                    if (status == false)
                    {
                        var existingNotify = notifies.FirstOrDefault(n => n.IdPurchaseOrder == idPurchase);

                        if (existingNotify == null)
                        {
                            var newNotify = new PurchaseNotify
                            {
                                IdPurchaseOrder = purchase.Id,
                                Message = $"Số Phiếu Nhập {purchase.Id} Chưa quét.",
                                Status = false
                            };


                            notifies.Add(newNotify);
                            db.PurchaseNotifies.Add(newNotify);
                        }
                        else
                        {
                            existingNotify.Message = $"Số Phiếu Nhập {purchase.Id} Chưa quét.";
                        }
                    }
                    else
                    {
                        var existingNotify = notifies.FirstOrDefault(n => n.IdPurchaseOrder == idPurchase);
                        if (existingNotify != null)
                        {
                            db.PurchaseNotifies.Remove(existingNotify);
                            notifies.Remove(existingNotify);
                        }
                    }
                }
                db.SaveChanges();

                var numNotify = db.PurchaseOrders.Count(x => x.Status == false);

                return Json(new { code = 200, numNotify }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult SaleOrderNotify()
        {
            try
            {
                var saleorder = db.SalesOrders.ToList();
                var notifies = db.SaleOrderNotifies.ToList();

                foreach (var saleorders in saleorder)
                {
                    var idsaleorder = saleorders.Id;
                    var status = saleorders.Status;

                    if (status == false)
                    {
                        var existingNotify = notifies.FirstOrDefault(n => n.IdSaleOrder == idsaleorder);

                        if (existingNotify == null)
                        {
                            var newNotify = new SaleOrderNotify
                            {
                                IdSaleOrder = saleorders.Id,
                                Message = $"Số Phiếu Xuất {saleorders.Id} Chưa quét.",
                                Status = false
                            };

                            notifies.Add(newNotify);
                            db.SaleOrderNotifies.Add(newNotify);
                        }
                        else
                        {
                            existingNotify.Message = $"Số Phiếu Xuất {saleorders.Id} Chưa quét.";
                        }
                    }
                    else
                    {
                        var existingNotify = notifies.FirstOrDefault(n => n.IdSaleOrder == idsaleorder);
                        if (existingNotify != null)
                        {
                            db.SaleOrderNotifies.Remove(existingNotify);
                            notifies.Remove(existingNotify);
                        }
                    }
                }
                db.SaveChanges();

                var numNotify = db.SalesOrders.Count(x => x.Status == false);

                return Json(new { code = 200, numNotify }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult GetRecentPage(string PageURL, string titlePage)
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.Name;

                if (!string.IsNullOrWhiteSpace(PageURL))
                {
                    var recentpageExit = db.RecentPages.FirstOrDefault(x => x.UserName == username && x.PageURL == PageURL);

                    if (recentpageExit != null)
                    {
                        recentpageExit.AccessedAt = DateTime.Now;
                    }
                    else
                    {
                        var recentPage = new RecentPage
                        {
                            PageURL = PageURL,
                            UserName = username,
                            Title = titlePage,
                            AccessedAt = DateTime.Now,
                            Status = true,
                        };

                        var userRecentPages = db.RecentPages
                                                .Where(rp => rp.UserName == username)
                                                .OrderByDescending(rp => rp.AccessedAt)
                                                .ToList();

                        if (userRecentPages.Count() >= 3)
                        {
                            db.RecentPages.Remove(userRecentPages.Last());
                        }

                        db.RecentPages.Add(recentPage);
                    }

                    db.SaveChanges();
                }

                return Json(new { code = 200 }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult RecentPageShow()
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.Name;

                var recentpage = db.RecentPages.Where(rp => rp.UserName == username).OrderByDescending(rp => rp.AccessedAt).ToList();

                return Json(new { code = 200, recentpage }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        //trả về chuỗi ngôn ngữ được lấy từ key resources
        [HttpGet]
        public JsonResult GetResources(string key)
        {
            var resourceSet = Resources.Resource.ResourceManager.GetResourceSet(System.Globalization.CultureInfo.CurrentCulture, true, true);

            foreach (DictionaryEntry entry in resourceSet)
            {
                if (entry.Value.ToString() == key)
                {
                    return Json(entry, JsonRequestBehavior.AllowGet); ; // Trả về khóa (Name) khi giá trị trùng khớp với Neutral Value
                }
            }

            //var resourceValue = Resources.Resource.ResourceManager.GetString(key);
            return Json(new {code = 500}, JsonRequestBehavior.AllowGet);
        }
        //[HttpGet]
        //public JsonResult Chat()
        //{
        //    try
        //    {

        //        var user = (User)Session["user"];
        //        var chat = (from c in db.ChatMes
        //                    where c.IdUserReceipt == user.Id
        //                    join uRe in db.Users on c.IdUserReceipt equals uRe.Id
        //                    join uSe in db.Users on c.IdUserSend equals uSe.Id
        //                    select new
        //                    {
        //                        c.Id,
        //                        UserReceipt = uRe.Name,
        //                        UserSend = uSe.Name,
        //                        IdUserSend = uSe.Id,
        //                        c.CreateDate,
        //                        c.Status,
        //                        c.Text
        //                    }).ToList();
        //        var numNotYetNotice = chat.Where(x => x.Status == false).Count();
        //        var listChat = chat
        //              .GroupBy(x => x.UserSend)
        //              .Select(group => new
        //              {
        //                  UserSend = group.Key,
        //                  LatestMessage = group.OrderByDescending(x => x.CreateDate).FirstOrDefault(),
        //                  Count = group.Count(message => message.Status == false)
        //              })
        //              .ToList();
        //        return Json(new { code = 200, numNotYetNotice, chat, listChat , /*IdSendNew*/ }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception e)
        //    {
        //        return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}
        //[HttpGet]
        //public JsonResult DetailChat(int pageNumber, string id)
        //{
        //    try
        //    {
        //        var statusChat = db.ChatMes.Where(x => x.IdUserSend == id).ToList();
        //        foreach(var s in statusChat)
        //        {
        //            s.Status = true;
        //        };
        //        db.SaveChanges();
        //        int pageSize = 5;
        //        var user = (User)Session["user"];
        //        var chat = (from c in db.ChatMes
        //                    where (c.IdUserReceipt == user.Id&&c.IdUserSend==id)|| (c.IdUserReceipt == id && c.IdUserSend == user.Id)
        //                    join uRe in db.Users on c.IdUserReceipt equals uRe.Id
        //                    join uSe in db.Users on c.IdUserSend equals uSe.Id
        //                    orderby c.CreateDate descending
        //                    select new
        //                    {
        //                        c.Id,
        //                        UserReceipt = uRe.Name,
        //                        UserSend = uSe.Name,
        //                        IdUserSend = uSe.Id,
        //                        statusSend = uSe.Status==true?"hoạt Động":"Không Hoạt Động",
        //                        c.CreateDate,
        //                        c.Status,
        //                        c.Text
        //                    }).ToList();
        //        var pages = chat.Count() % pageSize == 0 ? chat.Count() / pageSize : chat.Count() / pageSize + 1;
        //        var chatNew = chat.FirstOrDefault();
        //        chat = chat.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();
        //        return Json(new { code = 200, chat, pages , chatNew }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception e)
        //    {
        //        return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //} 
        //[HttpPost]
        //public JsonResult Send(string text,string id)
        //{
        //    try
        //    {
        //        var user = (User)Session["user"];
        //        if (!string.IsNullOrWhiteSpace(text))
        //        {
        //            ChatMe chat = new ChatMe() { 
        //                Text = text,
        //                IdUserReceipt = id,
        //                IdUserSend = user.Id,
        //                Status = false,
        //                CreateDate = DateTime.Now

        //            };
        //            db.ChatMes.Add(chat);
        //            db.SaveChanges();
        //        }
        //        return Json(new { code = 200,  }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception e)
        //    {
        //        return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}
        //[HttpPost]
        //public JsonResult ChangeSession()
        //{
        //    try
        //    {
        //        var User = (User)Session["user"];
        //        var newUser = db.Users.Find(User.Id);
        //        Session["user"] = newUser;

        //        return Json(new { code = 200, }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception e)
        //    {
        //        return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}
        [System.Web.Mvc.HttpGet]
        public JsonResult Page_Load()
        { // Kiểm tra tính còn hiệu lực của phiên làm việc
            try
            {
                if (Session["user"] == null)
                {
                    return Json(new { code = 401, }, JsonRequestBehavior.AllowGet);
                }
                return Json(new { code = 200, }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = "Lỗi " + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        //Lấy thêm số lượng thông báo phiếu xuất khi kéo thanh scroll xuống
        public JsonResult GetSaleOrderNoti(int page, int pageSize)
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.User1;
                var userID = user.Id;
                //Kiểm tra quyền duyệt phiếu có trong hệ thống
                var getPermission = db.Permissions.FirstOrDefault(x => x.Name_Permission == "Duyệt Phiếu");
                if (getPermission != null)
                {
                    var getIdPermission = getPermission.Id;
                    //Kiểm tra người dùng có quyền trong hệ thống không
                    var userPermission = db.User_Permission.FirstOrDefault(x => x.ID_User == userID && x.ID_Permission == getIdPermission);
                    if (userPermission != null)
                    {
                        //Lấy danh sách các phiếu nhập cũng như trong thông báo
                        var saleorder = db.SalesOrders.ToList();
                        var notifies = db.SaleOrderNotifies.ToList();

                        foreach (var saleorders in saleorder)
                        {
                            var idsaleorder = saleorders.Id;
                            var status = saleorders.HandlingStatus;

                            //Kiểm tra nếu trạng thái phiếu là chưa duyệt
                            if (status == 1)
                            {
                                //Lấy thông báo có cùng số id của phiếu xuất
                                var existingNotify = notifies.FirstOrDefault(n => n.IdSaleOrder == idsaleorder);

                                //Chưa có thì tạo mới thông báo
                                if (existingNotify == null)
                                {
                                    var newNotify = new SaleOrderNotify
                                    {
                                        IdSaleOrder = saleorders.Id,
                                        Message = $"{rm.GetString("noti_so")} {saleorders.Id} {rm.GetString("noti_notapprove")}",
                                        Status = true,
                                        CreateBy = username
                                    };

                                    notifies.Add(newNotify);
                                    db.SaleOrderNotifies.Add(newNotify);
                                }
                                else
                                {
                                    //Có rồi thì cập nhật lại message
                                    existingNotify.Message = $"{rm.GetString("noti_so")} {saleorders.Id} {rm.GetString("noti_notapprove")}";
                                }
                            }
                            else
                            {
                                //Nếu trạng thái phiếu là đã duyệt hoặc hủy, loại ra khỏi thông báo
                                var existingNotify = notifies.FirstOrDefault(n => n.IdSaleOrder == idsaleorder);
                                if (existingNotify != null)
                                {
                                    db.SaleOrderNotifies.Remove(existingNotify);
                                    notifies.Remove(existingNotify);
                                }
                            }
                        }

                        db.SaveChanges();
                        //Đếm số thông báo người dùng chưa xem
                        var numNotify = db.SaleOrderNotifies.Count(x => x.Status == true && x.CreateBy == username);

                        //Tổng thông báo của người dùng
                        var totalNotify = db.SaleOrderNotifies.Count(x => x.CreateBy == username);

                        //Lấy các thông báo phiếu xuất của người dùng
                        var updateNotifies = db.SaleOrderNotifies.Where(x => x.CreateBy == username)
                                                                .OrderBy(x => x.Id)
                                                                .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                                                .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                                                .ToList();
                        return Json(new { code = 200, numNotify, totalNotify, updateNotifies }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { code = 500}, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    return Json(new { code = 500 }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetPurchaseOrderNoti(int page, int pageSize)
        {
            try
            {
                var user = (Models.User)Session["user"];
                var userID = user.Id;
                var username = user.User1;
                //Kiểm tra quyền duyệt phiếu có trong hệ thống
                var getPermission = db.Permissions.FirstOrDefault(x => x.Name_Permission == "Duyệt Phiếu");
                if (getPermission != null)
                {
                    var getIdPermission = getPermission.Id;

                    //Kiểm tra người dùng có quyền trong hệ thống
                    var userPermission = db.User_Permission.FirstOrDefault(x => x.ID_User == userID && x.ID_Permission == getIdPermission);
                    if (userPermission != null)
                    {
                        //Lấy các phiếu nhập cũng như các thông báo
                        var purchases = db.PurchaseOrders.ToList();
                        var notifies = db.PurchaseNotifies.ToList();

                        foreach (var purchase in purchases)
                        {
                            var idpurchaseorder = purchase.Id;
                            var status = purchase.HandlingStatus;

                            //Kiểm tra nếu trạng thái phiếu là chưa duyệt
                            if (status == 1)
                            {
                                //Lấy thông báo có cùng id với số phiếu nhập
                                var existingNotify = notifies.FirstOrDefault(n => n.IdPurchaseOrder == idpurchaseorder);

                                //Chưa có thì tạo mới thông báo
                                if (existingNotify == null)
                                {
                                    var newNotify = new PurchaseNotify
                                    {
                                        IdPurchaseOrder = purchase.Id,
                                        Message = $"{rm.GetString("noti_po")} {purchase.Id} {rm.GetString("noti_notapprove")}",
                                        Status = true,
                                        CreateBy = username
                                    };

                                    notifies.Add(newNotify);
                                    db.PurchaseNotifies.Add(newNotify);
                                }
                                else
                                {
                                    //Có rồi thì cập nhật lại message
                                    existingNotify.Message = $"{rm.GetString("noti_po")}   {purchase.Id}   {rm.GetString("noti_notapprove")}";
                                }
                            }
                            else
                            {
                                //Nếu trạng thái phiếu là đã duyệt hoặc hủy, loại ra khỏi thông báo
                                var existingNotify = notifies.FirstOrDefault(n => n.IdPurchaseOrder == idpurchaseorder);
                                if (existingNotify != null)
                                {
                                    db.PurchaseNotifies.Remove(existingNotify);
                                    notifies.Remove(existingNotify);
                                }
                            }
                        }
                        db.SaveChanges();

                        //Đếm số thông báo người dùng chưa xem
                        var numNotify = db.PurchaseNotifies.Count(x => x.Status == true && x.CreateBy == username);

                        //Tổng thông báo của người dùng
                        var totalNotify = db.PurchaseNotifies.Count(x => x.CreateBy == username);

                        //Lấy các thông báo phiếu nhập của người dùng
                        var updateNotifies = db.PurchaseNotifies.Where(x => x.CreateBy == username)
                                                                .OrderBy(x => x.Id)
                                                                .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                                                .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                                                .ToList();


                        return Json(new { code = 200, numNotify, updateNotifies, totalNotify }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { code = 500 }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    return Json(new { code = 500 }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        //Sự kiện thay đổi trạng thái thông báo khi người dùng click vào sử dụng cho PO, SO
        [HttpPost]
        public JsonResult InventoryNotifyClicked(string message, string type)
        {
            try
            {
                if (String.IsNullOrEmpty(type))
                {
                    return Json(new { code = 500, msg = "Lỗi! Không có type phù hợp" });
                }
                var user = (Models.User)Session["user"];
                var username = user.User1;
                //Check type của phiếu là PO
                if (type == "PO")
                {
                    //Lấy các thông báo phiếu nhập của người dùng
                    foreach (var stockNotify in db.PurchaseNotifies.Where(x => x.Status == true && x.CreateBy == username))
                    {
                        //Thay đổi trạng thái khi có cùng message thông báo
                        if (stockNotify.Message.Trim() == message.Trim())
                        {
                            stockNotify.Status = false;
                            break;
                        }
                    }
                    db.SaveChanges();
                    return Json(new { code = 200 }, JsonRequestBehavior.AllowGet);
                }
                //Check type của phiếu là SO
                else if (type == "SO")
                {
                    //Lấy các thông báo phiếu xuất của người dùng
                    foreach (var stockNotify in db.SaleOrderNotifies.Where(x => x.Status == true && x.CreateBy == username))
                    {
                        //Thay đổi trạng thái khi có cùng message thông báo
                        if (stockNotify.Message.Trim() == message.Trim())
                        {
                            stockNotify.Status = false;
                            break;
                        }
                    }
                    db.SaveChanges();
                    return Json(new { code = 200 }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { code = 500, msg = "Lỗi! Không có type phù hợp" });
                }


            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = "Lỗi: " + ex.Message });
            }
        }
        //[HttpGet]
        //public JsonResult GetUserNotify(int page, int pageSize)
        //{
        //    try
        //    {
        //        var user = (Models.User)Session["user"];
        //        var username = user.User1;
        //        var userID = user.Id;
        //        const int CONDITIONNOTIFY = 2;

        //        // Lấy danh sách quyền của user
        //        var userPermissions = db.User_Permission.Where(up => up.ID_User == userID).Select(up => up.ID_Permission).ToList();
        //        var permissionList = db.Permissions.Where(p => userPermissions.Contains(p.Id)).ToList();

        //        bool warehouseCheck = permissionList.Any(p => p.Name_Permission == "Danh Sách Chi Tiết Kho");
        //        bool goodCheck = permissionList.Any(p => p.Name_Permission == "Danh Sách Chi Tiết Hàng Hóa");
        //        bool adminCheck = permissionList.Any(p => p.Name_Permission == "Duyệt Phiếu");

        //        // Lấy dữ liệu tồn kho, hàng hóa
        //        var warehouses = db.WareHouses.Select(w => new
        //        {
        //            w.Id,
        //            w.Name,
        //            w.MinInventory,
        //            w.MaxInventory,
        //            TotalInventory = db.DetailWareHouses.Where(d => d.IdWareHouse == w.Id).Sum(d => d.Inventory)
        //        }).ToList();

        //        var notifications = db.InventoryNotifies.Where(n => n.UserName == username).ToList();

        //        foreach (var warehouse in warehouses)
        //        {
        //            var existNotify = notifications.FirstOrDefault(n => n.Warehouse == warehouse.Name && n.Goods == null);
        //            if (warehouse.TotalInventory - warehouse.MinInventory <= CONDITIONNOTIFY ||
        //                warehouse.MaxInventory - warehouse.TotalInventory <= CONDITIONNOTIFY)
        //            {
        //                var message = warehouse.TotalInventory - warehouse.MinInventory <= CONDITIONNOTIFY
        //                    ? $"{rm.GetString("Tổng Lượng Tồn Hàng Hóa")} {rm.GetString("Trong")} {warehouse.Name} {rm.GetString("Còn")} {warehouse.TotalInventory}. "
        //                    : $"{rm.GetString("Tổng Lượng Tồn Hàng Hóa")} {rm.GetString("Trong")} {warehouse.Name} {rm.GetString("Sắp Đầy!")}. ";

        //                if (existNotify == null)
        //                {
        //                    db.InventoryNotifies.Add(new InventoryNotify
        //                    {
        //                        IdWareHouse = warehouse.Id,
        //                        Warehouse = warehouse.Name,
        //                        Message = message,
        //                        Status = true,
        //                        CreateDate = DateTime.Now,
        //                        NewInventory = warehouse.TotalInventory,
        //                        UserName = username
        //                    });
        //                }
        //                else
        //                {
        //                    existNotify.NewInventory = warehouse.TotalInventory;
        //                    existNotify.Message = message;
        //                }
        //            }
        //            else if (existNotify != null)
        //            {
        //                db.InventoryNotifies.Remove(existNotify);
        //            }
        //        }

        //        db.SaveChanges();

        //        var warehouseNoti = db.InventoryNotifies.Where(x => x.IdGoods == null && x.UserName == username)
        //                            .OrderBy(x => x.Warehouse)
        //                            .Skip((page - 1) * pageSize)
        //                            .Take(pageSize)
        //                            .ToList();

        //        var numWHNotify = db.InventoryNotifies.Count(x => x.Status == true && x.UserName == username && x.IdGoods == null);
        //        var totalWH = db.InventoryNotifies.Count(x => x.UserName == username && x.IdGoods == null);

        //        var goodNotify = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods != null)
        //                            .OrderBy(n => n.Goods)
        //                            .Skip((page - 1) * pageSize)
        //                            .Take(pageSize)
        //                            .ToList();

        //        var numGoodNotify = db.InventoryNotifies.Count(x => x.Status == true && x.UserName == username && x.IdGoods != null);
        //        var totalGood = db.InventoryNotifies.Count(x => x.UserName == username && x.IdGoods != null);

        //        int countTotal = numWHNotify + numGoodNotify;

        //        if (adminCheck)
        //        {
        //            var numPONotify = db.PurchaseNotifies.Count(x => x.Status == true && x.CreateBy == username);
        //            var totalPO = db.PurchaseNotifies.Count(x => x.CreateBy == username);
        //            var updatePONotifies = db.PurchaseNotifies.Where(x => x.CreateBy == username)
        //                                                 .OrderBy(x => x.Id)
        //                                                 .Skip((page - 1) * pageSize)
        //                                                 .Take(pageSize)
        //                                                 .ToList();

        //            var numSONotify = db.SaleOrderNotifies.Count(x => x.Status == true && x.CreateBy == username);
        //            var totalSO = db.SaleOrderNotifies.Count(x => x.CreateBy == username);
        //            var updateSONotifies = db.SaleOrderNotifies.Where(x => x.CreateBy == username)
        //                                                 .OrderBy(x => x.Id)
        //                                                 .Skip((page - 1) * pageSize)
        //                                                 .Take(pageSize)
        //                                                 .ToList();

        //            countTotal += numPONotify + numSONotify;

        //            return Json(new { code = 200, numWHNotify, warehouseNoti, totalWH, goodNotify, numGoodNotify, totalGood, numPONotify, updatePONotifies, totalPO, numSONotify, totalSO, updateSONotifies, countTotal, adminCheck, warehouseCheck, goodCheck }, JsonRequestBehavior.AllowGet);
        //        }

        //        return Json(new { code = 200, numWHNotify, warehouseNoti, totalWH, goodNotify, numGoodNotify, totalGood, countTotal, adminCheck, warehouseCheck, goodCheck }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}
        //Hàm lấy tổng các thông báo của người dùng
        [HttpGet]
        public JsonResult GetUserNotify(int page, int pageSize)
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.User1;
                var userID = user.Id;
                var warehouses = db.WareHouses.ToList();
                const int CONDITIONNOTIFY = 10;
                ////Check quyền xem tồn kho của người dùng
                //var warehouseCheck = false;
                //var getPermission = db.Permissions.FirstOrDefault(x => x.Name_Permission == "Danh Sách Chi Tiết Kho");
                //if (getPermission != null)
                //{
                //    var getIdPermission = getPermission.Id;
                //    var userPermission = db.User_Permission.FirstOrDefault(x => x.ID_User == userID && x.ID_Permission == getIdPermission);
                //    if (userPermission != null)
                //    {
                //        warehouseCheck = true;
                //    }
                //}

                ////Check quyền xem tồn kho của người dùng
                //var goodCheck = false;
                //getPermission = db.Permissions.FirstOrDefault(x => x.Name_Permission == "Danh Sách Chi Tiết Hàng Hóa");
                //if (getPermission != null)
                //{
                //    var getIdPermission = getPermission.Id;
                //    var userPermission = db.User_Permission.FirstOrDefault(x => x.ID_User == userID && x.ID_Permission == getIdPermission);
                //    if (userPermission != null)
                //    {
                //        goodCheck = true;
                //    }
                //}
                //Lấy tổng các thông báo chưa đọc của người dùng
                var countTotal = 0;
                //var getListNotifies = db.InventoryNotifies.Where(x => x.UserName == username).ToList();
                //var getPONotifies = db.PurchaseNotifies.Where(x => x.CreateBy == username).ToList();
                //var getSONotifies = db.SaleOrderNotifies.Where(x => x.CreateBy == username).ToList();
                //db.PurchaseNotifies.RemoveRange(getPONotifies);
                //db.SaleOrderNotifies.RemoveRange(getSONotifies);
                //db.InventoryNotifies.RemoveRange(getListNotifies);
                var notifications = db.InventoryNotifies.ToList();
                //Cụm thông báo kho và hàng hóa
                foreach (var warehouse in warehouses)
                {
                    //Lấy thông tin kho
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
                            // Tạo thông báo mới nếu chưa có trong StockNotify và tổng tồn kho có số lượng dưới 2
                            var newNotify = new InventoryNotify
                            {
                                IdWareHouse = warehouseId,
                                Warehouse = warehouseName,
                                Message = $"TotalProductStockInWarehouse | {warehouseName} | Remaining | {totalInventory}",
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
                            existNotify.Message = $"TotalProductStockInWarehouse | {warehouseName} | Remaining | {totalInventory}";
                        }
                    }
                    else if (maxInventory - totalInventory <= CONDITIONNOTIFY)
                    {
                        if (existNotify == null)
                        {
                            // Tạo thông báo mới nếu chưa có trong StockNotify và tổng tồn kho sắp đầy
                            var newNotify = new InventoryNotify
                            {
                                IdWareHouse = warehouseId,
                                Warehouse = warehouseName,
                                Message = $"TotalProductStockInWarehouse | {warehouseName} | AlmostFull",
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
                            existNotify.Message = $"TotalProductStockInWarehouse | {warehouseName} | AlmostFull";
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

                //Lấy thông báo về hàng hóa trong kho
                var goodsInWarehouse = db.Goods.Where(x => !x.Id.Contains("J") && x.Inventory <= CONDITIONNOTIFY).ToList();
                foreach (var goods in goodsInWarehouse)
                {
                    var namegoods = goods.Name;
                    var idgoods = goods.Id;
                    var goodsInventory = goods.Inventory;

                    var existGoodsNotify = notifications.FirstOrDefault(n => n.Goods == namegoods && n.UserName == username);
                    //Số lượng hàng hóa gần hết
                    if (existGoodsNotify == null)
                    {
                        // Tạo thông báo mới nếu chưa có trong StockNotify
                        var newGoodsNotify = new InventoryNotify
                        {
                            IdGoods = idgoods,
                            Goods = namegoods,
                            NewInventory = goodsInventory,
                            Message = $"TotalProductStock | {namegoods} | Remaining | {goodsInventory}",
                            Status = true,
                            CreateDate = DateTime.Now,
                            UserName = username,
                        };

                        notifications.Add(newGoodsNotify);
                        db.InventoryNotifies.Add(newGoodsNotify);
                    }
                    else
                    {
                        // Cập nhật thông báo cho sản phẩm nếu đã có trong StockNotify
                        existGoodsNotify.NewInventory = goodsInventory;
                        existGoodsNotify.Message = $"TotalProductStock | {namegoods} | Remaining | {goodsInventory}";
                    }
                }

                db.SaveChanges();

                //Lấy các thông báo kho của người dùng
                var warehouseNoti = db.InventoryNotifies.Where(x => x.IdGoods == null && x.UserName == username)
                                    .OrderBy(x => x.Warehouse)
                                    .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                    .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                    .ToList();

                // hiển thị số lượng thông tin có trạng thái là true
                var numWHNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username && x.IdGoods == null).Count();

                countTotal += numWHNotify;

                //Tổng thông báo kho
                var totalWH = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods == null).ToList().Count();

                //Lấy số lượng thông báo hàng hóa
                var goodNotify = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods != null)
                                    .OrderBy(n => n.Goods).Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                    .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                    .ToList();

                //Lấy số lượng thông báo chưa đọc của người dùng
                var numGoodNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username && x.IdGoods != null).Count();

                //Tổng thông báo hàng hóa của người dùng
                var totalGood = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods != null).ToList().Count();

                countTotal += numGoodNotify;

                //Check quyền duyệt phiếu của người dùng
                var adminCheck = false;
                if (Session["permissions"] != null)
                {
                    var getListUserPermission = (List<int>)(Session["permissions"]);
                    adminCheck = getListUserPermission.Any(x => x == 21);
                }
                
                //Nếu người dùng có quyền duyệt phiếu
                if (adminCheck)
                {
                    //Lấy các phiếu nhập cũng như các thông báo
                    var purchases = db.PurchaseOrders.ToList();
                    var ponotifies = db.PurchaseNotifies.Where(x => x.CreateBy == username).ToList();

                    foreach (var purchase in purchases)
                    {
                        var idpurchaseorder = purchase.Id;
                        var status = purchase.HandlingStatus;

                        //Kiểm tra nếu trạng thái phiếu là chưa duyệt
                        if (status == 1)
                        {
                            //Lấy thông báo có cùng số phiếu nhập
                            var existingNotify = ponotifies.FirstOrDefault(n => n.IdPurchaseOrder == idpurchaseorder);

                            //Chưa có thì tạo mới thông báo
                            if (existingNotify == null)
                            {
                                var newNotify = new PurchaseNotify
                                {
                                    IdPurchaseOrder = purchase.Id,
                                    Message = $"ImportVoucherId | {purchase.Id} | NotApproved",
                                    Status = true,
                                    CreateBy = username
                                };

                                ponotifies.Add(newNotify);
                                db.PurchaseNotifies.Add(newNotify);
                            }
                            else
                            {
                                //Có rồi thì cập nhật lại message
                                existingNotify.Message = $"ImportVoucherId | {purchase.Id} | NotApproved";
                            }
                        }
                        else
                        {
                            //Nếu trạng thái phiếu là đã duyệt hoặc hủy, loại ra khỏi thông báo
                            var existingNotify = ponotifies.FirstOrDefault(n => n.IdPurchaseOrder == idpurchaseorder);
                            if (existingNotify != null)
                            {
                                db.PurchaseNotifies.Remove(existingNotify);
                                ponotifies.Remove(existingNotify);
                            }
                        }
                    }

                    //Lấy các phiếu xuất cũng như các thông báo
                    var saleorder = db.SalesOrders.ToList();
                    var sonotifies = db.SaleOrderNotifies.Where(x => x.CreateBy == username).ToList();

                    foreach (var saleorders in saleorder)
                    {
                        var idsaleorder = saleorders.Id;
                        var status = saleorders.HandlingStatus;

                        //Kiểm tra nếu trạng thái phiếu là chưa duyệt
                        if (status == 1)
                        {
                            //Lấy thông báo có cùng số phiếu xuất
                            var existingNotify = sonotifies.FirstOrDefault(n => n.IdSaleOrder == idsaleorder);

                            //Chưa có thì tạo mới thông báo
                            if (existingNotify == null)
                            {
                                var newNotify = new SaleOrderNotify
                                {
                                    IdSaleOrder = saleorders.Id,
                                    Message = $"ExportVoucher | {saleorders.Id} | NotApproved",
                                    Status = true,
                                    CreateBy = username
                                };

                                sonotifies.Add(newNotify);
                                db.SaleOrderNotifies.Add(newNotify);
                            }
                            else
                            {
                                //Có rồi thì cập nhật lại message
                                existingNotify.Message = $"ExportVoucher | {saleorders.Id} | NotApproved";
                            }
                        }
                        else
                        {
                            //Nếu trạng thái phiếu là đã duyệt hoặc hủy, loại ra khỏi thông báo
                            var existingNotify = sonotifies.FirstOrDefault(n => n.IdSaleOrder == idsaleorder);
                            if (existingNotify != null)
                            {
                                db.SaleOrderNotifies.Remove(existingNotify);
                                sonotifies.Remove(existingNotify);
                            }
                        }
                    }

                    db.SaveChanges();
                    //Đếm số lượng thông báo phiếu nhập người dùng chưa đọc
                    var numPONotify = db.PurchaseNotifies.Count(x => x.Status == true && x.CreateBy == username);

                    //Đếm tổng số thông báo người dùng
                    var totalPO = db.PurchaseNotifies.Count(x => x.CreateBy == username);

                    //Lấy các thông báo phiếu nhập của người dùng
                    var updatePONotifies = db.PurchaseNotifies.Where(x => x.CreateBy == username)
                                                            .OrderBy(x => x.Id)
                                                            .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                                            .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                                            .ToList();

                    countTotal += numPONotify;

                    //Đếm số lượng thông báo phiếu xuất chưa đọc
                    var numSONotify = db.SaleOrderNotifies.Count(x => x.Status == true && x.CreateBy == username);

                    //Đếm tổng số lượng thông báo phiếu xuất của người dùng
                    var totalSO = db.SaleOrderNotifies.Count(x => x.CreateBy == username);

                    //Lấy các thông báo phiếu xuất của người dùng
                    var updateSONotifies = db.SaleOrderNotifies.Where(x => x.CreateBy == username)
                                                            .OrderBy(x => x.Id)
                                                            .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                                            .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                                            .ToList();

                    countTotal += numSONotify;

                    //Trả về khi người dùng có quyền duyệt phiếu
                    return Json(new { code = 200, numWHNotify, warehouseNoti, totalWH, goodNotify, numGoodNotify, totalGood, numPONotify, updatePONotifies, totalPO, numSONotify, totalSO, updateSONotifies, countTotal, adminCheck }, JsonRequestBehavior.AllowGet);
                }
                //Trả về khi người dùng không có quyền duyệt phiếu
                return Json(new { code = 200, numWHNotify, warehouseNoti, totalWH, goodNotify, numGoodNotify, totalGood, countTotal, adminCheck }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetInventoryNotifies(int page, int pageSize)
        {
            try
            {
                var warehouses = db.WareHouses.ToList();
                var user = (Models.User)Session["user"];
                var username = user.User1;
                var userID = user.Id;
                var notifications = db.InventoryNotifies.ToList();
                const int CONDITIONNOTIFY = 10;
                //Cụm thông báo kho và hàng hóa
                foreach (var warehouse in warehouses)
                {
                    //Lấy thông tin kho
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
                            // Tạo thông báo mới nếu chưa có trong StockNotify và tổng tồn kho có số lượng dưới 2
                            var newNotify = new InventoryNotify
                            {
                                IdWareHouse = warehouseId,
                                Warehouse = warehouseName,
                                Message = $"TotalProductStockInWarehouse | {warehouseName} | Remaining | {totalInventory}",
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
                            existNotify.Message = $"TotalProductStockInWarehouse | {warehouseName} | Remaining | {totalInventory}";
                        }
                    }
                    else if (maxInventory - totalInventory <= CONDITIONNOTIFY)
                    {
                        if (existNotify == null)
                        {
                            // Tạo thông báo mới nếu chưa có trong StockNotify và tổng tồn kho sắp đầy
                            var newNotify = new InventoryNotify
                            {
                                IdWareHouse = warehouseId,
                                Warehouse = warehouseName,
                                Message = $"TotalProductStockInWarehouse | {warehouseName} | AlmostFull",
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
                            existNotify.Status = true;
                            existNotify.Message = $"TotalProductStockInWarehouse | {warehouseName} | AlmostFull";
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

                //Lấy thông báo về hàng hóa trong kho
                var goodsInWarehouse = db.Goods.Where(x => !x.Id.Contains("J") && x.Inventory <= CONDITIONNOTIFY).ToList();
                var getNotifies = db.InventoryNotifies.Where(x => !db.Goods.Any(g => g.Id == x.IdGoods)).ToList();
                db.InventoryNotifies.RemoveRange(getNotifies);
                foreach (var goods in goodsInWarehouse)
                {
                    var namegoods = goods.Name;
                    var idgoods = goods.Id;
                    var goodsInventory = goods.Inventory;

                    var existGoodsNotify = notifications.FirstOrDefault(n => n.Goods == namegoods && n.UserName == username);

                    //Số lượng hàng hóa gần hết
                    if (existGoodsNotify == null)
                    {
                        // Tạo thông báo mới nếu chưa có trong StockNotify
                        var newGoodsNotify = new InventoryNotify
                        {
                            IdGoods = idgoods,
                            Goods = namegoods,
                            NewInventory = goodsInventory,
                            Message = $"TotalProductStock | {namegoods} | Remaining | {goodsInventory}",
                            Status = true,
                            CreateDate = DateTime.Now,
                            UserName = username,
                        };

                        notifications.Add(newGoodsNotify);
                        db.InventoryNotifies.Add(newGoodsNotify);
                    }
                    else
                    {
                        // Cập nhật thông báo cho sản phẩm nếu đã có trong StockNotify
                        existGoodsNotify.NewInventory = goodsInventory;
                        existGoodsNotify.Status = true;
                        existGoodsNotify.Message = $"TotalProductStock | {namegoods} | Remaining | {goodsInventory}";
                    }
                }

                db.SaveChanges();

                //Lấy các thông báo kho của người dùng
                var warehouseNoti = db.InventoryNotifies.Where(x => x.IdGoods == null && x.UserName == username)
                                    .OrderBy(x => x.Warehouse)
                                    .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                    .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                    .ToList();

                // hiển thị số lượng thông tin có trạng thái là true
                var numWHNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username && x.IdGoods == null).Count();

                //Tổng thông báo kho
                var totalWH = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods == null).ToList().Count();

                //Lấy số lượng thông báo hàng hóa
                var goodNotify = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods != null)
                                    .OrderBy(n => n.Goods).Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                    .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                    .ToList();

                //Lấy số lượng thông báo chưa đọc của người dùng
                var numGoodNotify = db.InventoryNotifies.Where(x => x.Status == true && x.UserName == username && x.IdGoods != null).Count();

                //Tổng thông báo hàng hóa của người dùng
                var totalGood = db.InventoryNotifies.Where(n => n.UserName == username && n.IdGoods != null).ToList().Count();

                return Json(new { code = 200, numWHNotify, warehouseNoti, totalWH, goodNotify, numGoodNotify, totalGood }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);

            }
        }
        
        [HttpGet]
        public JsonResult GetFormNotifies(int page, int pageSize)
        {
            try
            {
                var user = (Models.User)Session["user"];
                var username = user.User1;
                var userID = user.Id;
                //Lấy các phiếu nhập cũng như các thông báo
                var purchases = db.PurchaseOrders.Where(x => x.HandlingStatus == 1).ToList();
                var getPONotifies = db.PurchaseNotifies.Where(x => !db.PurchaseOrders.Any(g => g.Id == x.IdPurchaseOrder)).ToList();
                db.PurchaseNotifies.RemoveRange(getPONotifies);
                var ponotifies = db.PurchaseNotifies.Where(x => x.CreateBy == username).ToList();

                foreach (var purchase in purchases)
                {
                    var idpurchaseorder = purchase.Id;

                    //Lấy thông báo có cùng số phiếu nhập
                    var existingNotify = ponotifies.FirstOrDefault(n => n.IdPurchaseOrder == idpurchaseorder);

                    //Chưa có thì tạo mới thông báo
                    if (existingNotify == null)
                    {
                        var newNotify = new PurchaseNotify
                        {
                            IdPurchaseOrder = purchase.Id,
                            Message = $"ImportVoucherId | {purchase.Id} | NotApproved",
                            Status = true,
                            CreateBy = username
                        };

                        ponotifies.Add(newNotify);
                        db.PurchaseNotifies.Add(newNotify);
                    }
                    else
                    {
                        //Có rồi thì cập nhật lại message
                        existingNotify.Message = $"ImportVoucherId | {purchase.Id} | NotApproved";
                    }
                }

                //Lấy các phiếu xuất cũng như các thông báo
                var saleorder = db.SalesOrders.Where(x => x.HandlingStatus == 1).ToList();
                var getSONotifies = db.SaleOrderNotifies.Where(x => !db.SalesOrders.Any(g => g.Id == x.IdSaleOrder)).ToList();
                db.SaleOrderNotifies.RemoveRange(getSONotifies);
                var sonotifies = db.SaleOrderNotifies.Where(x => x.CreateBy == username).ToList();

                foreach (var saleorders in saleorder)
                {
                    var idsaleorder = saleorders.Id;
                    //Lấy thông báo có cùng số phiếu xuất
                    var existingNotify = sonotifies.FirstOrDefault(n => n.IdSaleOrder == idsaleorder);

                    //Chưa có thì tạo mới thông báo
                    if (existingNotify == null)
                    {
                        var newNotify = new SaleOrderNotify
                        {
                            IdSaleOrder = saleorders.Id,
                            Message = $"ExportVoucher | {saleorders.Id} | NotApproved",
                            Status = true,
                            CreateBy = username
                        };

                        sonotifies.Add(newNotify);
                        db.SaleOrderNotifies.Add(newNotify);
                    }
                    else
                    {
                        //Có rồi thì cập nhật lại message
                        existingNotify.Message = $"ExportVoucher | {saleorders.Id} | NotApproved";
                    }
                }

                db.SaveChanges();
                //Đếm số lượng thông báo phiếu nhập người dùng chưa đọc
                var numPONotify = db.PurchaseNotifies.Count(x => x.Status == true && x.CreateBy == username);

                //Đếm tổng số thông báo người dùng
                var totalPO = db.PurchaseNotifies.Count(x => x.CreateBy == username);

                //Lấy các thông báo phiếu nhập của người dùng
                var updatePONotifies = db.PurchaseNotifies.Where(x => x.CreateBy == username)
                                                        .OrderBy(x => x.Id)
                                                        .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                                        .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                                        .ToList();

                //Đếm số lượng thông báo phiếu xuất chưa đọc
                var numSONotify = db.SaleOrderNotifies.Count(x => x.Status == true && x.CreateBy == username);

                //Đếm tổng số lượng thông báo phiếu xuất của người dùng
                var totalSO = db.SaleOrderNotifies.Count(x => x.CreateBy == username);

                //Lấy các thông báo phiếu xuất của người dùng
                var updateSONotifies = db.SaleOrderNotifies.Where(x => x.CreateBy == username)
                                                        .OrderBy(x => x.Id)
                                                        .Skip((page - 1) * pageSize)  // Bỏ qua số lượng sản phẩm ở các trang trước
                                                        .Take(pageSize) // Lấy số lượng sản phẩm theo pageSize
                                                        .ToList();


                return Json(new { code = 200, numPONotify, updatePONotifies, totalPO, numSONotify, totalSO, updateSONotifies }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, msg = rm.GetString("error") + ": " + ex.Message }, JsonRequestBehavior.AllowGet);

            }
        }

        public JsonResult SearchFunction(string query)
        {
            try
            {
                var language = Session[Common.Currentculture].ToString();
                var getFunction = db.SearchFunctions.Where(db => db.Language == language && db.Name.ToLower().Contains(query.ToLower().Trim()) && db.Url != null)
                                                        .Select(db => new
                                                        {
                                                            db.PermissionId,
                                                            db.Name,
                                                            db.Url
                                                        })
                                                        .ToList();
                return Json(new { code = 200, data = getFunction, message = "Thành công" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = "Lỗi: " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetRFIDFunction()
        {
            try
            {
                var rfidStatus = db.ModelSettings.FirstOrDefault(x => x.Id == "rfidScanningStatus");
                if(rfidStatus == null)
                {
                    return Json(new { code = 500 }, JsonRequestBehavior.AllowGet);
                }
                return Json(new { code = 200, rfidStatus.Status }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { code = 500, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}