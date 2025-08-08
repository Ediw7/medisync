import React from "react";
import {
  FaHome,
  FaCogs,
  FaTruck,
  FaChartLine,
  FaClipboardList,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

const SidebarProdusen = ({ isCollapsed, setIsCollapsed }) => {
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    { path: "/produsen/dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/produsen/manajemen-produksi", icon: <FaCogs />, label: "Manajemen Produksi" },
    { path: "/produsen/pengelolaan-pengiriman", icon: <FaTruck />, label: "Pengelolaan Pengiriman" },
    { path: "/produsen/monitoring-stok", icon: <FaChartLine />, label: "Monitoring Stok" },
    { path: "/produsen/laporan-analitik", icon: <FaClipboardList />, label: "Laporan Analitik" },
  ];

  return (
    <div
      style={{ backgroundColor: "#18A375" }}
      className={`fixed top-0 left-0 h-screen text-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex justify-between items-center p-4 pt-16">
        <h3 className={`text-lg font-semibold ${isCollapsed ? "hidden" : "block"}`}>
          Dashboard Produsen
        </h3>
        <button onClick={toggleSidebar} className="text-white text-xl focus:outline-none">
          {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center p-3 transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${isActive ? "bg-[#46B591]" : "hover:bg-[#46B591]"}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarProdusen;
