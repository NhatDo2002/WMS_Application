using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WMS.Models;
using System.Threading;
using System.Web.Routing;
using System.Globalization;
using Resources;
using System.Resources;

namespace WMS.Controllers
{
    public class BaseController : Controller
    {
        private Validation validator = new Validation();
        private WMSEntities db = new WMSEntities();
        private ResourceManager rm = new ResourceManager("WMS.App_GlobalResources.Resource", typeof(Resources.Resource).Assembly);
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        // GET: Base
        {
            //if (Session["user"] == null)
            //{
            //    filterContext.Result = new RedirectToRouteResult(new System.Web.Routing.RouteValueDictionary(new {area = "", controller = "Login", action = "Login" }));
            //}

            if (Session["user"] == null)
            {
                filterContext.Result = new RedirectToRouteResult(
                    new System.Web.Routing.RouteValueDictionary(new { area = "", controller = "Login", action = "Login" }));
                filterContext.HttpContext.Response.StatusCode = 302;
                filterContext.HttpContext.Response.Redirect(Url.Action("Login", "Login", new { area = "" }));
                //filterContext.HttpContext.Response.Redirect(Url.Action("Login", "Auth"));
                //filterContext.HttpContext.ApplicationInstance.CompleteRequest();
                return;
            }

            var getUrl = filterContext.HttpContext.Request.Url.AbsolutePath;
            var UrlReferrer = filterContext.HttpContext.Request.UrlReferrer;
            var method = filterContext.HttpContext.Request.HttpMethod;
            var getAllPermissions = Session["allPermissions"] as List<Permission>;
            var checkPermission = getAllPermissions.FirstOrDefault(x => (x.Action != null && x.Action.ToLower().Trim() == getUrl.ToLower().Trim()));
            if (checkPermission != null)
            {
                if (Session["permissions"] != null)
                {
                    var listUserPermissions = Session["permissions"] as List<int>;
                    var checkUserPermission = listUserPermissions.Any(x => x == checkPermission.Id);
                    if (!checkUserPermission)
                    {
                        if (method == "POST")
                        {
                            var jsonData = new
                            {
                                code = 500,
                                message = $"{rm.GetString("permission_not")}",
                            };
                            filterContext.Result = new JsonResult
                            {
                                Data = jsonData,
                                JsonRequestBehavior = JsonRequestBehavior.AllowGet // Cho phép GET nếu cần
                            };
                        }
                        else if (method == "GET")
                        {
                            TempData["PermitAnnounce"] = false;
                            if (UrlReferrer != null)
                            {
                                filterContext.Result = new RedirectResult(UrlReferrer.ToString());
                            }
                            else
                            {
                                var jsonData = new
                                {
                                    code = 500,
                                    message = $"{rm.GetString("permission_not")}",
                                };
                                filterContext.Result = new RedirectToRouteResult(
                                new System.Web.Routing.RouteValueDictionary(new { area = "", controller = "Home", action = "Index" }));
                            }
                        }
                        else
                        {
                            TempData["PermitAnnounce"] = false;
                            filterContext.Result = new RedirectToRouteResult(
                                new System.Web.Routing.RouteValueDictionary(new { area = "", controller = "Home", action = "Index" }));
                        }
                    }
                }

            }
        }
        //Initializing culture on controller Initialization
        protected override void Initialize(RequestContext requestContext)
        {
            base.Initialize(requestContext);
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
        }
        // change culture
        [HttpPost]
        public ActionResult ChangeCulture(string ddlculture, string returnUrl)
        {
            Thread.CurrentThread.CurrentCulture = new CultureInfo(ddlculture);
            Thread.CurrentThread.CurrentUICulture = new CultureInfo(ddlculture);

            Session[Common.Currentculture] = ddlculture;

            return Json(new { success = true, redirectUrl = returnUrl, language = ddlculture });
        }

        [HttpGet]
        public JsonResult SignOut()
        {
            try
            {
                db.Configuration.ProxyCreationEnabled = false;
                Session["user"]=null;
               return Json(new { code = 200, }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult UpdateSessionCheck()
        {
            Session["notPermission"] = false;
            return Json(new { code = 200, }, JsonRequestBehavior.AllowGet);
        }
    }
}