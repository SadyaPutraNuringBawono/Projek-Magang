"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import KasiranLogo from "@/public/kasiran.svg"

interface MenuItem {
  label: string
  link?: string
  items?: {
    name: string
    link: string
    subItems?: { name: string; link: string }[]
  }[]
}

const menuItems: MenuItem[] = [
  { label: "DASHBOARD", link: "/" },
  {
    label: "MASTER",
    items: [
      { name: "Barang", link: "/master/barang" },
      { name: "Kategori", link: "/master/kategori" },
      { name: "Brand / Merk", link: "/master/brand" },
      { name: "Satuan", link: "/master/satuan" },
      { name: "Pelanggan", link: "/master/pelanggan" },
      { name: "Supplier", link: "/master/supplier" },
      {
        name: "Diskon, Pajak, Modul Biaya",
        link: "#",
        subItems: [
          { name: "Diskon", link: "/master/diskon" },
          { name: "Pajak", link: "/master/pajak" },
          { name: "Modul Biaya", link: "/master/biaya" },
        ],
      },
    ],
  },
  {
    label: "PENGATURAN",
    items: [
      { name: "Toko", link: "/pengaturan/toko" },
      { name: "Cabang / Pusat", link: "/pengaturan/cabang" },
      { name: "Manajemen Staff", link: "/pengaturan/staff" },
    ],
  },
]

export function Sidebar() {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [expandedSubMenus, setExpandedSubMenus] = useState<Set<string>>(new Set())
  const pathname = usePathname()

  // Tambahkan fungsi untuk cek apakah submenu aktif
  const isMenuActive = (item: MenuItem) => {
    if (item.link && pathname === item.link) return true
    if (item.items) {
      return item.items.some(
        (sub) =>
          pathname === sub.link ||
          (sub.subItems && sub.subItems.some((nested) => pathname === nested.link))
      )
    }
    return false
  }

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(label)) {
        newSet.delete(label)
      } else {
        newSet.add(label)
      }
      return newSet
    })
  }

  const toggleSubMenu = (name: string) => {
    setExpandedSubMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      return newSet
    })
  }

  return (
    <div className="h-full w-64 bg-[#00A651] py-4 text-white">
      <div className="p-6">
        <div className="flex justify-center">
          <div className="relative h-12 w-40">
            <Image src={KasiranLogo} alt="Kasiran Logo" fill priority className="object-contain" />
          </div>
        </div>
        <p className="mt-3 text-center text-sm">Web Kasiran Ver. x.x.x 2025</p>
      </div>

      <nav className="space-y-1 p-2">
        {menuItems.map((item) => (
          <div key={item.label}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between text-white hover:bg-green-800 hover:text-white",
                item.label === "DASHBOARD" && pathname === "/" && "bg-green-700",
                isMenuActive(item) && "bg-green-700",
                expandedMenus.has(item.label) && item.items && "bg-green-800",
              )}
              onClick={() => item.items && toggleMenu(item.label)}
              asChild={!item.items && !!item.link}
            >
              {!item.items && item.link ? (
                <Link href={item.link}>{item.label}</Link>
              ) : (
                <>
                  {item.label}
                  {item.items && (
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expandedMenus.has(item.label) && "rotate-180")}
                    />
                  )}
                </>
              )}
            </Button>

            {/* Expand menu jika aktif atau sudah di-expand manual */}
            {item.items && (expandedMenus.has(item.label) || isMenuActive(item)) && (
              <div className="mt-1 space-y-1 pl-4">
                {item.items.map((subItem) => (
                  <div key={subItem.name}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm font-normal text-white hover:bg-green-800 hover:text-white",
                        pathname === subItem.link && "bg-green-700",
                        subItem.subItems && "justify-between",
                      )}
                      onClick={() => subItem.subItems && toggleSubMenu(subItem.name)}
                      asChild={!subItem.subItems}
                    >
                      {!subItem.subItems ? (
                        <Link href={subItem.link}>{subItem.name}</Link>
                      ) : (
                        <>
                          {subItem.name}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expandedSubMenus.has(subItem.name) && "rotate-180",
                            )}
                          />
                        </>
                      )}
                    </Button>

                    {subItem.subItems && expandedSubMenus.has(subItem.name) && (
                      <div className="mt-1 space-y-1 pl-4">
                        {subItem.subItems.map((nestedItem) => (
                          <Button
                            key={nestedItem.name}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-sm font-normal text-white hover:bg-green-800 hover:text-white",
                              pathname === nestedItem.link && "bg-green-700",
                            )}
                            asChild
                          >
                            <Link href={nestedItem.link}>{nestedItem.name}</Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
