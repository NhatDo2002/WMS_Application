using Microsoft.Ajax.Utilities;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;
using WMS.Models;
using System;
using System.Globalization;
using System.Numerics;
using System.Threading;
using System.Resources;
using System.Data.Entity;
namespace WMS.Controllers
{
    public class LoginController : Controller
    {
        private WMSEntities db = new WMSEntities();
        ResourceManager rm = new ResourceManager("WMS.App_GlobalResources.Resource", typeof(Resources.Resource).Assembly);
        // GET: Login
        public ActionResult Index()
        {
            if (Session["user"] != null)
            {
                return RedirectToAction("Login", "Login");
            }
            return View();
        }

        public ActionResult Login()
        {
            if (Session[Common.Currentculture] != null)
            {
                Thread.CurrentThread.CurrentCulture = new CultureInfo(Session[Common.Currentculture].ToString());
                Thread.CurrentThread.CurrentUICulture = new CultureInfo(Session[Common.Currentculture].ToString());
            }
            else
            {
                Session[Common.Currentculture] = "zh-CN";
                Thread.CurrentThread.CurrentCulture = new CultureInfo("zh-CN");
                Thread.CurrentThread.CurrentUICulture = new CultureInfo("zh-CN");
            }
            return View();
        }

        [HttpPost]
        public ActionResult ChangeCulture(string ddlculture)
        {
            Thread.CurrentThread.CurrentCulture = new CultureInfo(ddlculture);
            Thread.CurrentThread.CurrentUICulture = new CultureInfo(ddlculture);

            Session[Common.Currentculture] = ddlculture;

            return Json(new { success = true, language = ddlculture });
        }


        //Chính
        [HttpPost]
        public JsonResult LoginiGMS()
        {
            Thread.CurrentThread.CurrentCulture = new CultureInfo("en");
            Thread.CurrentThread.CurrentUICulture = new CultureInfo("en");
            try
            {
                if (Request.Params.Count > 0)
                {
                    var user = Request.Form["User"];
                    var pass = Request.Form["Pass"];
                    //var checkUser = db.Users.SingleOrDefault(x => x.User1 == user);
                    var checkUser = (from i in db.Users
                                     where i.User1 == user
                                     select i).FirstOrDefault();
                    if (checkUser != null)
                    {
                        if (checkUser.FailPass == 5)
                        {
                            return Json(new { code = 500, message = rm.GetString("lock_account_admin") });
                        }
                        if (checkUser.Pass == Encode.ToMD5(pass))
                        {
                            checkUser.LoginTime = DateTime.Now;
                            checkUser.FailPass = 0;
                            db.SaveChanges();
                            Session["user"] = checkUser;
                            Session["account"] = checkUser.User1;
                            var userPermissions = db.User_Permission
                            .Where(x => x.ID_User == checkUser.Id)
                            .Select(x => x.Permission.Id)
                            .ToList();
                            // Lưu vào session
                            Session["permissions"] = userPermissions;
                            var getAllPermissions = db.Permissions.ToList();
                            Session["allPermissions"] = getAllPermissions;
                            //Session["roleadmin"] = db.RoleAdmins.Find(checkUser.RoleAdmin);
                            //Session["role"] = db.Roles.Find(checkUser.Role);
                            return Json(new { code = 200, message = rm.GetString("login_success"), url = "/Home/Index" });
                        }
                        else
                        {
                            checkUser.FailPass += 1;
                            if (checkUser.FailPass == 5) { checkUser.Status = false; };
                            db.SaveChanges();
                            return Json(new
                            {
                                code = 500,
                                message = checkUser.FailPass != 5 ? rm.GetString("account_error_pass_incorrect") + "\n" + rm.GetString("account_error_pass_count_lock") + " " + checkUser.FailPass + " " + rm.GetString("account_error_pass_time_will") + " " + (5 - checkUser.FailPass) + " " + rm.GetString("account_error_pass_wrong_more")
                                                                                : rm.GetString("account_error_pass_locked")
                            }, JsonRequestBehavior.AllowGet);
                        }
                    }
                    else
                    {
                        return Json(new { code = 500, message = rm.GetString("account_error_no_exist"), data= Request.Params });
                    }
                }
                else
                {
                    return Json(new { code = 500, message = rm.GetString("data_no") });
                }

            }
            catch (Exception e)
            {
                return Json(new { code = 500, message = "Sai !!!" + e.Message });
            }
        }
        //Phụ
        /*[HttpPost]
        public JsonResult LoginiGMS()
        {
            try
            {
                if (Request.Form.Count > 0)
                {
                    var user = Request.Form["username"];
                    var pass = Request.Form["password"];
                    var checkUser = db.Users.SingleOrDefault(x => x.User1 == user);
                    if (checkUser != null)
                    {
                        if (checkUser.FailPass == 5)
                        {
                            return Json(new { code = 500, msg = "Tài Khoản Đã Bị Khóa, Liên Hệ Quản Trị Viên Để Mở Khóa!!!" }, JsonRequestBehavior.AllowGet);
                        }
                        if (checkUser.Pass == Encode.ToMD5(pass))
                        {
                            checkUser.LoginTime = DateTime.Now;
                            checkUser.FailPass = 0;
                            db.SaveChanges();
                            Session["user"] = checkUser;
                            return Json(new { code = 200, msg = "Đăng Nhập Thành Công", url = "/Home/Index" }, JsonRequestBehavior.AllowGet);
                        }
                        else
                        {
                            checkUser.FailPass += 1;
                            if (checkUser.FailPass == 5) { checkUser.Status = false; };
                            db.SaveChanges();
                            return Json(new
                            {
                                code = 500,
                                msg = checkUser.FailPass != 5 ? "Mật Khẩu Không Đúng !!!\nTài Khoản Đã Nhập Sai Mật Khẩu " + checkUser.FailPass + " Lần, Bị Khóa Sau " + (5 - checkUser.FailPass) + " Lần Nhập Sai!"
                                                                                : "Tài Khoản Đã Bị Khóa Vì Nhập Mật Khẩu Sai 5 Lần Liên Tiếp!!!"
                            }, JsonRequestBehavior.AllowGet);
                        }
                    }
                    else
                    {
                        return Json(new { code = 500, msg = "Tài Khoản Không Tồn Tại !!!" }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    return Json(new { code = 500, msg = "Không Có Dữ Liệu !!!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }*/
        [HttpGet]
        public JsonResult LoginApi(ApiAccount apiAccount, string ApiRolesString)
        {
            try
            {
                List<ApiRole> ApiRoles = JsonConvert.DeserializeObject<List<ApiRole>>(ApiRolesString);

                // Gán danh sách ApiRoles vào đối tượng ApiAccount
                apiAccount.ApiRoles = ApiRoles;
                var username = apiAccount.UserName;

                var roleUser = (from i in db.Roles
                               where i.Username == username
                               select i).FirstOrDefault();
                var roleAdmin = (from i in db.RoleAdmins
                                 where i.Username == username
                                 select i).FirstOrDefault();
                var setNewRole = new SetRole();
                if (roleUser == null)
                {
                    if (setNewRole.SetNewRole(username))
                    {
                        if (roleAdmin == null)
                        {
                            if (setNewRole.SetNewAdminRole(username) == false)
                            {
                                return Json(new { code = 500, msg = "Chưa tạo được !" }, JsonRequestBehavior.AllowGet);
                            }
                        }
                    }
                    else
                    {
                        return Json(new { code = 500, msg = "Chưa tạo được !" }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    if (roleAdmin == null)
                    {
                        if (setNewRole.SetNewAdminRole(username) == false)
                        {
                            return Json(new { code = 500, msg = "Chưa tạo được !" }, JsonRequestBehavior.AllowGet);
                        }
                    }
                }
                Session["user"] = apiAccount;
                return Json(new { code = 200, msg = " Tài Khoản Hợp Lệ !", data = Session["user"] }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = "Sai !" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpGet]
        public JsonResult Scan(string id)
        {
            try
            {
                var a = db.Users.SingleOrDefault(x => x.Id==id);
                var user = a.User1;
                var pass = a.Pass;
                if (a != null)
                {
                    a.LoginTime = DateTime.Now;
                    db.SaveChanges();
                    a = db.Users.SingleOrDefault(x => x.Id == id);
                    Session["user"] = a;
                    return Json(new { code = 200, Url = "/Home/Index", user= user, pass= pass }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { code = 300, msg = "Tài Khoản Hoặc Mật Khẩu không Đúng !!!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        } 
    }
}