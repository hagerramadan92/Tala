"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Gift, ImageIcon, PackageOpen, Utensils } from "lucide-react";
import styles from "./packages.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1";
type Pkg = { id:number; name:string; description?:string|null; image?:string|null; background_image?:string|null; products_count?:number };

export default function PackagesPage() {
  const [packages,setPackages]=useState<Pkg[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{let alive=true; fetch(`${API_URL}/packages`,{headers:{Accept:"application/json"},cache:"no-store"}).then(r=>r.json()).then(d=>{if(alive)setPackages(d?.data||[])}).catch(()=>{}).finally(()=>{if(alive)setLoading(false)}); return()=>{alive=false}},[]);
  return <main dir="rtl" className={styles.page}>
    <div className={`${styles.decoration} ${styles.decorationTop}`} aria-hidden="true"/><div className={`${styles.decoration} ${styles.decorationBottom}`} aria-hidden="true"/>
    <section className={styles.listContainer}>
      <header className={styles.heading}><div className={styles.giftIcon}><Gift strokeWidth={1.8}/></div><h1>باكدجات</h1><span className={styles.titleLine}/><p>باكدجات مختارة تجمع لك أفضل المنتجات بأسعار وكميات جاهزة.</p></header>
      {loading?<div className={styles.packageGrid}>{Array.from({length:2}).map((_,i)=><div key={i} className={styles.skeleton}/>)}</div>:packages.length===0?<div className={styles.empty}>لا توجد باكدجات متاحة حاليًا.</div>:
      <div className={styles.packageGrid}>{packages.map((pkg,index)=>{const FoodIcon=pkg.name.includes("مطاعم")?Utensils:PackageOpen; return <article key={pkg.id} className={styles.packageCard}>
        <div className={`${styles.packageImage} ${index%2?styles.peachImage:styles.blueImage}`}>{pkg.image?<Image src={pkg.image} alt={pkg.name} fill sizes="(max-width:720px) 100vw, 50vw" className={styles.containImage}/>:<div className={styles.imagePlaceholder}><ImageIcon strokeWidth={1.5}/></div>}</div>
        <div className={styles.cardFooter}><div className={styles.packageMeta}><span className={styles.smallIcon}><FoodIcon/></span><div><h2>{pkg.name}</h2><p>{pkg.products_count||0} {pkg.products_count===1?"منتج":"منتجات"}</p></div></div><Link href={`/packages/${pkg.id}`} className={styles.viewButton}><span>عرض الباقة</span><ArrowLeft size={19}/></Link></div>
      </article>})}</div>}
    </section>
  </main>;
}
