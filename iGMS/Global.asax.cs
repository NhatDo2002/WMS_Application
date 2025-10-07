using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace WMS
{
    public class MvcApplication : System.Web.HttpApplication
    {
        string con = ConfigurationManager.ConnectionStrings["WMSConnected"].ConnectionString;
        protected void Application_Start()
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            ServicePointManager.ServerCertificateValidationCallback = (sender, cert, chain, sslPolicyErrors) => true;
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            SqlDependency.Start(con);
            //var rfid = new RFID();
            //rfid.Subscribe();
            //rfid.StartReadingTag();
            ////var tcpServer = new TcpServer("192.168.1.172", 9102);
            ////tcpServer.Start();
            //var iData = new iData();
            //iData.OpenReader();
            //iData.Connect();

        }
        protected void Application_End()
        {
            if(HttpContext.Current != null && HttpContext.Current.Session != null)
                Session.Abandon();
            SqlDependency.Stop(con);
        }
    }
}
