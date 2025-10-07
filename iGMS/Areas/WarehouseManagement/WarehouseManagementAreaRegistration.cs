using System.Web.Mvc;

namespace WMS.Areas.WarehouseManagement
{
    public class WarehouseManagementAreaRegistration : AreaRegistration 
    {
        public override string AreaName 
        {
            get 
            {
                return "WarehouseManagement";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context) 
        {
            context.MapRoute(
                "WarehouseManagement_default",
                "WarehouseManagement/{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional }
            );
        }
    }
}