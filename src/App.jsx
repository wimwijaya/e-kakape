import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { 
  Search, Plus, Download, Info, Trash2, User, FileText, 
  LayoutDashboard, LogOut, Menu, X, ShieldCheck, Smartphone,
  FileBox, Calendar, Briefcase, FileSearch, Archive, CheckCircle,
  Clock, MapPin, Eye, EyeOff, AlertCircle, QrCode, Lock, ChevronLeft,
  ChevronRight, Bell, Settings, Filter, MoreVertical, Share2, 
  Printer, RefreshCw, ArrowLeft, ClipboardList, Camera, ImageIcon, 
  Upload, Edit3, Save, Check, File as FileIcon, Hash, ChevronDown, 
  ShieldAlert, UserCheck, Users, Mail, Image as ImageIconUI
} from 'lucide-react';

/* Menambahkan Global Style untuk Font Garamond */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=EB+Garamond:wght@400..800&display=swap');

  .font-garamond {
    font-family: 'EB Garamond', 'Cormorant Garamond', serif !important;
  }
  
  /* Menghilangkan scrollbar pada menu navigasi untuk tampilan rapi */
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

/* --- Konfigurasi Keamanan (Standard TOTP) --- */
const TOTP_SECRET_BASE32 = "JBSWY3DPEHPK3PXP"; 
const TOTP_ISSUER = "IPW1_SIGI";

/* ======================================================================
   GAMBAR DARI GOOGLE DRIVE
====================================================================== */
const G_DRIVE_BACKGROUND_ID = "1BNjp5Oo14OankSDLyRZodIJtJa768UPS";
const G_DRIVE_LOGO_ID = "1seDzz8AbTL5HwOo9XXvZI0nbh4KXpcw9"; 
const getGDriveUrl = (id) => id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1920` : null;

/* --- Database Personel (Whitelist NIP yang diperbolehkan masuk) --- */
const INITIAL_USER_DATABASE = [
  { nip: "197711122002122002", name: "ADE IRMA, ST., MPW", rank: "PEMBINA UTAMA MUDA, IV/C", position: "AUDITOR AHLI MADYA" },
  { nip: "197803112000121002", name: "RUSDIN S. DAUD, S.FARM., MM., QRMP", rank: "PEMBINA, IV/A", position: "PPUPD AHLI MADYA" },
  { nip: "198304192011011007", name: "WIWIN ADIPUTRA, S.IP., MM., QRMA", rank: "PEMBINA, IV/A", position: "AUDITOR AHLI MUDA" },
  { nip: "198210132010011009", name: "MACHFUDZ, S.SOS., MM., QRMA", rank: "PENATA TINGKAT I, III/D", position: "AUDITOR AHLI MUDA" },
  { nip: "198004182011012005", name: "KARTINI. SP", rank: "PENATA, III/C", position: "PPUPD AHLI MUDA" },
  { nip: "198412042010011008", name: "TRI WAHYU BASUKI, SE", rank: "PENATA, III/C", position: "AUDITOR AHLI MUDA" },
  { nip: "198312112014111001", name: "MOHAMAD RIZAL, SE., M.AK", rank: "PENATA, III/C", position: "PPUPD AHLI MUDA" },
  { nip: "197009141999031005", name: "SUPRIO, ST", rank: "PENATA, III/C", position: "AUDITOR AHLI MUDA" },
  { nip: "197709072014112001", name: "DEWI SUNDARI, SE", rank: "PENATA MUDA TINGKAT I, III/B", position: "AUDITOR AHLI PERTAMA" },
  { nip: "199301022022031008", name: "DHIMAS CHAIDAR, ST", rank: "PENATA MUDA, III/A", position: "AUDITOR AHLI PERTAMA" },
  { nip: "200111012024092001", name: "ANNISA NURUL NAFILAH PALENGA, S.TR.I.P", rank: "PENATA MUDA, III/A", position: "PPUPD AHLI PERTAMA" },
  { nip: "199805122025061001", name: "I MADE DEDY INDRA PERMANA, S.I.P", rank: "PENATA MUDA, III/A", position: "PPUPD AHLI PERTAMA" },
  { nip: "199803172025061002", name: "MUH. NUR IMAN, S.H", rank: "PENATA MUDA, III/A", position: "PPUPD AHLI PERTAMA" },
  { nip: "199708212025061001", name: "LUHUR AJI SAPUTRO, S.I.P", rank: "PENATA MUDA, III/A", position: "PPUPD AHLI PERTAMA" },
  { nip: "199909262025061003", name: "MUHAMAD ILHAM WIJAYA, S.T", rank: "PENATA MUDA, III/A", position: "PPUPD AHLI PERTAMA" },
  { nip: "199611102025061004", name: "HADI, A.MD.AK", rank: "PENGATUR, II/C", position: "AUDITOR TERAMPIL" },
];

const TABS = ["SEMUA DATA", "KERTAS KERJA REVIU", "KERTAS KERJA EVALUASI"];
const YEARS = ["SEMUA TAHUN", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];

/* ======================================================================
   FIREBASE INITIALIZATION
====================================================================== */
// Ganti bagian di bawah ini dengan konfigurasi dari Firebase Console Anda
// CATATAN PENTING: Saat aplikasi ini Anda pindahkan ke VS Code untuk di-deploy ke Vercel, 
// pastikan untuk mengganti string "ISI_DENGAN_..." dengan format import.meta.env.VITE_... 
// seperti yang dijelaskan pada dokumen PANDUAN_DEPLOY.md.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBpTfKbFy-wyG4eD3mjMjCYPwTGjdSLO_8",
  authDomain: "e-kakape-irban1.firebaseapp.com",
  projectId: "e-kakape-irban1",
  storageBucket: "e-kakape-irban1.firebasestorage.app",
  messagingSenderId: "564534080781",
  appId: "1:564534080781:web:04d85f0f0e6d75dc352c44"
};

// Inisialisasi Firebase secara aman
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase belum dikonfigurasi dengan benar.");
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'e-arsip-sigi';

/* --- Helper: TOTP Logic --- */
const base32ToBuf = (base32) => {
   const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
   let bits = 0, value = 0, index = 0;
   const output = new Uint8Array((base32.length * 5 / 8) | 0);
   for (let i = 0; i < base32.length; i++) {
       const charIdx = alphabet.indexOf(base32[i].toUpperCase());
       if (charIdx === -1) continue;
       value = (value << 5) | charIdx;
       bits += 5;
       if (bits >= 8) {
           output[index++] = (value >> (bits - 8)) & 255;
           bits -= 8;
       }
    }
   return output;
};

const generateTOTP = async (secretBase32) => {
   const key = base32ToBuf(secretBase32);
   const epoch = Math.round(new Date().getTime() / 1000.0);
   const time = Math.floor(epoch / 30);
   const timeBuf = new ArrayBuffer(8);
   const view = new DataView(timeBuf);
   view.setUint32(4, time);
   const cryptoKey = await window.crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
   const hmac = await window.crypto.subtle.sign("HMAC", cryptoKey, timeBuf);
   const hmacRes = new Uint8Array(hmac);
   const offset = hmacRes[hmacRes.length - 1] & 0xf;
   const code = ((hmacRes[offset] & 0x7f) << 24) | ((hmacRes[offset + 1] & 0xff) << 16) | ((hmacRes[offset + 2] & 0xff) << 8) | (hmacRes[offset + 3] & 0xff);
   return (code % 1000000).toString().padStart(6, '0');
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all text-left">
      <div className={`w-full ${maxWidth} bg-[#FDF5E6]/95 backdrop-blur-xl rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-300`}>
        <div className="px-8 py-6 flex justify-between items-center bg-[#FDF5E6]/50">
          <h3 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"><X size={20} /></button>
        </div>
        <div className="p-10">{children}</div>
      </div>
    </div>
  );
};

/* Login Background Options */
const LOGIN_BGS = [
  { id: 'bg1', name: 'Kuning-Oranye', gradient: 'from-yellow-400 to-orange-500' },
  { id: 'bg2', name: 'Biru-Ungu', gradient: 'from-blue-400 to-purple-500' },
  { id: 'bg3', name: 'Hijau-Tosca', gradient: 'from-green-400 to-teal-500' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('login'); 
  const [loginStep, setLoginStep] = useState('select'); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null); 
  const [activeYear, setActiveYear] = useState('SEMUA TAHUN');
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]); 
  const [modal, setModal] = useState({ type: null, data: null });
  const [profileImage, setProfileImage] = useState(null);
  
  const profileFileInputRef = useRef(null);
  const uploadFileInputRef = useRef(null);
  const yearMenuRef = useRef(null);
 
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isLinked, setIsLinked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkageInfo, setLinkageInfo] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
 
  const [editForm, setEditForm] = useState({ name: '', position: '', rank: '', instansi: 'INSPEKTORAT KABUPATEN SIGI' });

  /* Device ID Generation for Linkage */
  const localDeviceId = useMemo(() => {
    let id = localStorage.getItem('eArsip_deviceId');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('eArsip_deviceId', id);
    }
    return id;
  }, []);

  /* Firebase State & Effects */
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  /* UI Settings State (Persistent via LocalStorage) */
  const [loginBg, setLoginBg] = useState(() => {
     const savedBg = localStorage.getItem('eArsip_loginBg');
     return savedBg ? JSON.parse(savedBg) : LOGIN_BGS[0];
  }); 
  
  /* State Logo Custom */
  const [customLogo, setCustomLogo] = useState(() => {
    const defaultLogo = getGDriveUrl(G_DRIVE_LOGO_ID) || "https://img.freepik.com/premium-vector/isometric-filing-cabinet-folders-boxes-illustration_1284-53906.jpg";
    return localStorage.getItem('eArsip_customLogo') || defaultLogo;
  });
  const [logoSize, setLogoSize] = useState(() => {
    const savedSize = localStorage.getItem('eArsip_logoSize');
    return savedSize ? Number(savedSize) : 100;
  });
  const logoInputRef = useRef(null);

  useEffect(() => {
      localStorage.setItem('eArsip_loginBg', JSON.stringify(loginBg));
  }, [loginBg]);

  useEffect(() => {
      localStorage.setItem('eArsip_customLogo', customLogo);
  }, [customLogo]);

  useEffect(() => {
      localStorage.setItem('eArsip_logoSize', logoSize.toString());
  }, [logoSize]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFirebaseUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !db) return;
    const filesRef = collection(db, 'artifacts', appId, 'public', 'data', 'files');
    const unsubscribe = onSnapshot(filesRef, (snapshot) => {
      const fetchedFiles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFiles(fetchedFiles.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, (error) => {
      console.error("Firestore error:", error);
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const ms = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const mc = f.category === activeCategory;
      const my = activeYear === 'SEMUA TAHUN' || f.year === activeYear;
      
      let mo = true;
      if (currentUser?.role === 'ADMIN') {
          if (selectedStaff) mo = f.ownerNip === selectedStaff.nip;
      } else {
          mo = f.ownerNip === currentUser?.nip;
      }
      
      return ms && mc && my && mo;
    });
  }, [files, searchQuery, activeCategory, activeYear, selectedStaff, currentUser]);

  /* Helper untuk Tombol dan Panel Gradien Universal */
  const globalGradientStyle = { background: 'linear-gradient(98.7deg, rgba(34,175,245,1) 2.8%, rgba(98,247,151,1) 97.8%)', color: 'white', border: 'none' };
  const panelGradientStyle = { background: 'linear-gradient(90deg, #FBBF24 0%, #F97316 100%)', color: 'white', border: 'none' };
  
  /* STATS CONFIGURATION WITH GRADIENTS */
  const counts = useMemo(() => {
    const stats = {};
    TABS.forEach(tab => { if (tab !== "SEMUA DATA") stats[tab] = files.filter(f => f.category === tab).length; });
    return stats;
  }, [files]);

  const STATS_CONFIG = [
    { label: "KERTAS KERJA REVIU", count: counts["KERTAS KERJA REVIU"] || 0, color: "text-white", style: panelGradientStyle, icon: FileSearch },
    { label: "KERTAS KERJA EVALUASI", count: counts["KERTAS KERJA EVALUASI"] || 0, color: "text-white", style: panelGradientStyle, icon: CheckCircle },
  ];

  /* Helper untuk menentukan gradien tombol */
  const isKertasKerjaMenu = activeCategory === 'KERTAS KERJA REVIU' || activeCategory === 'KERTAS KERJA EVALUASI';
  const customAddButtonStyle = isKertasKerjaMenu ? globalGradientStyle : { backgroundColor: '#00a65a', color: 'white' };
  const customAddButtonClass = isKertasKerjaMenu 
        ? "px-8 py-4 rounded-3xl text-[12px] flex items-center gap-3 uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-95 leading-none font-bold"
        : "hover:bg-[#008d4c] px-8 py-4 rounded-3xl text-[12px] flex items-center gap-3 uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-95 leading-none font-bold";

  /* Helper untuk menyembunyikan email */
  const maskEmail = (email) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const namePart = parts[0];
    const domain = parts[1];
    if (namePart.length <= 2) return email; 
    const maskedName = namePart.substring(0, 2) + '*'.repeat(namePart.length - 2);
    return `${maskedName}@${domain}`;
  };

  /* Handlers */
  function getQrData() {
    if (!currentUser) return "";
    const roleLabel = currentUser.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const label = `${TOTP_ISSUER}_${roleLabel}:${currentUser.nip}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${TOTP_SECRET_BASE32}&issuer=${encodeURIComponent(TOTP_ISSUER)}`;
  }

  function handleUploadClick() {
    if (uploadFileInputRef.current) uploadFileInputRef.current.click();
  }

  const handlePreview = async (file) => {
    setPreviewingId(file.id);
    try {
      let url = file.fileData; 
      if (!url && file.chunkCount > 0) {
        let fullData = '';
        for (let i = 0; i < file.chunkCount; i++) {
           const chunkDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fileChunks', `${file.fileId}_${i}`));
           if (chunkDoc.exists()) fullData += chunkDoc.data().data;
        }
        url = fullData;
      }
      
      if (!url) {
        // Fallback jika tidak ada data asli
        const dummyContent = `DATA SIMULASI: ${file.name}\nKATEGORI: ${file.category}\nSURAT TUGAS: ${file.stNumber}\nTAHUN: ${file.year}`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        url = URL.createObjectURL(blob);
      } else if (url.startsWith('data:')) {
        // Konversi Data URI (Base64) ke Blob agar aman dibuka di tab baru (mencegah blokir browser)
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (mimeMatch) {
            const mime = mimeMatch[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], {type: mime});
            url = URL.createObjectURL(blob);
        }
      }
      
      window.open(url, '_blank');
    } catch (error) {
       console.error("Error previewing file:", error);
       setModal({ type: 'error', data: { message: 'Gagal memuat pratinjau berkas. Silakan coba lagi nanti.' } });
    } finally {
       setPreviewingId(null);
    }
  };

  const handleDownload = async (file) => {
    setDownloadingId(file.id);
    try {
      let url = file.fileData; 
      if (!url && file.chunkCount > 0) {
        let fullData = '';
        for (let i = 0; i < file.chunkCount; i++) {
           const chunkDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fileChunks', `${file.fileId}_${i}`));
           if (chunkDoc.exists()) fullData += chunkDoc.data().data;
        }
        url = fullData;
      }
      if (!url) {
        const dummyContent = `DATA SIMULASI: ${file.name}\nKATEGORI: ${file.category}\nSURAT TUGAS: ${file.stNumber}\nTAHUN: ${file.year}`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        url = URL.createObjectURL(blob);
      }
      const link = document.createElement('a');
      link.href = url; link.download = file.name;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link);
      if (!file.fileData && file.chunkCount === 0) URL.revokeObjectURL(url);
    } catch (error) {
       console.error("Error downloading file:", error);
       setModal({ type: 'error', data: { message: 'Gagal mengunduh berkas. Silakan coba lagi nanti.' } });
    } finally {
       setDownloadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (modal.data && modal.data.id && firebaseUser) {
      try {
        if (modal.data.chunkCount > 0) {
           for (let i = 0; i < modal.data.chunkCount; i++) {
              await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fileChunks', `${modal.data.fileId}_${i}`));
           }
        }
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'files', modal.data.id));
        setModal({ type: null, data: null });
      } catch (err) {
        console.error("Gagal hapus:", err);
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (yearMenuRef.current && !yearMenuRef.current.contains(event.target)) setShowYearMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanNipInput = nip.replace(/\s+/g, '');
    const foundUser = INITIAL_USER_DATABASE.find(u => u.nip === cleanNipInput);

    if (!foundUser) {
        setLoginError('NIP ANDA TIDAK TERDAFTAR DALAM SISTEM INSPEKTUR PEMBANTU WILAYAH 1.');
        return;
    }

    let isValid = false;
    let role = '';
    
    if (loginStep === 'user-form' && password === "Irban 1") {
        isValid = true; role = 'USER';
    } else if (loginStep === 'admin-form' && password === "Admin#Irban1") {
        isValid = true; role = 'ADMIN';
    } else {
        setLoginError('KREDENSIAL / PASSWORD SALAH.');
        return;
    }

    if (isValid) {
        if(!db) {
            setLoginError('SISTEM DATABASE BELUM DIKONFIGURASI. BACA PANDUAN_DEPLOY.md');
            return;
        }
        try {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'linkages', cleanNipInput);
            const snap = await getDoc(docRef);
            
            if (snap.exists()) {
                const data = snap.data();
                setLinkageInfo(data);
                setIsLinked(true);
            } else {
                setLinkageInfo(null);
                setIsLinked(false);
            }
            
            setCurrentUser({...foundUser, role: role, instansi: 'INSPEKTORAT KABUPATEN SIGI'});
            setCurrentPage('auth');
        } catch (err) {
            console.error("Gagal memvalidasi linkage:", err);
            setLoginError('GAGAL MEMERIKSA KEAMANAN PERANGKAT.');
        }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setOtpError('');
    
    const codeString = otp.join('');
    if (codeString.length < 6) { 
        setOtpError('MASUKKAN 6 DIGIT KODE.'); 
        setVerifying(false); 
        return; 
    }
    
    if (!isLinked && (!linkEmail || !linkEmail.toLowerCase().endsWith('@gmail.com'))) {
        setOtpError('MASUKKAN AKUN GMAIL YANG VALID (@GMAIL.COM) UNTUK MENAUTKAN PERANGKAT.');
        setVerifying(false);
        return;
    }

    try {
        const correct = await generateTOTP(TOTP_SECRET_BASE32);
        
        if (codeString === correct) {
            if (!isLinked && firebaseUser) {
                const linkageRef = doc(db, 'artifacts', appId, 'public', 'data', 'linkages', currentUser.nip);
                const snap = await getDoc(linkageRef);
                
                if (snap.exists() && snap.data().deviceId !== localDeviceId) {
                    setOtpError('AKUN INI TELAH TERTAUT EKSKLUSIF PADA PERANGKAT LAIN.');
                    setVerifying(false);
                    return;
                }

                await setDoc(linkageRef, {
                    deviceId: localDeviceId,
                    email: linkEmail.toLowerCase().trim(),
                    linkedAt: new Date().toISOString()
                });
                setLinkageInfo({ deviceId: localDeviceId, email: linkEmail.toLowerCase().trim() });
                setIsLinked(true);
            }
            
            setShowWelcome(true);
            setTimeout(() => {
                setShowWelcome(false);
                setCurrentPage('dashboard');
            }, 2000);

        } else { 
            setOtpError(`KODE SALAH.`); 
            setOtp(['','','','','','']); 
        }
    } catch (err) { 
        console.error(err);
        setOtpError('GAGAL VERIFIKASI KODE.'); 
    } finally { 
        setVerifying(false); 
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[idx] = val.slice(-1); setOtp(n); setOtpError('');
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx+1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleLogout = () => {
    setCurrentUser(null); setNip(''); setPassword(''); setShowPassword(false);
    setOtp(['','','','','','']); setOtpError('');
    setActiveCategory(null); setSelectedStaff(null); setLoginStep('select');
    setLinkEmail(''); setLinkageInfo(null);
    setCurrentPage('login');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setProfileImage(reader.result); setModal({ type: null, data: null }); };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file); setSelectedFileName(file.name);
      const titleInput = document.getElementById('new-filename');
      if (titleInput) titleInput.value = file.name.split('.').slice(0, -1).join('.');
    }
  };

  const handleProcessUpload = async () => {
    if (!firebaseUser) return;
    const nameInput = document.getElementById('new-filename');
    const stInput = document.getElementById('st-number');
    const yearInput = document.getElementById('upload-year');
    
    const nameVal = nameInput ? nameInput.value : selectedFileName;
    const stVal = stInput ? stInput.value : '-';
    const yrVal = yearInput ? yearInput.value : '2026';

    setIsUploading(true);
    
    try {
      let fileData = null;
      if (selectedFile) {
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const uniqueFileId = Date.now().toString() + Math.floor(Math.random() * 1000);
      let chunkCount = 0;
      
      if (fileData && fileData.length > 800000) {
        const chunkSize = 800000;
        chunkCount = Math.ceil(fileData.length / chunkSize);
        for (let i = 0; i < chunkCount; i++) {
          const chunkStr = fileData.substring(i * chunkSize, (i + 1) * chunkSize);
          const chunkRef = doc(db, 'artifacts', appId, 'public', 'data', 'fileChunks', `${uniqueFileId}_${i}`);
          await setDoc(chunkRef, { data: chunkStr });
        }
        fileData = null; 
      }

      const filesRef = collection(db, 'artifacts', appId, 'public', 'data', 'files');
      await addDoc(filesRef, {
        fileId: uniqueFileId,
        name: nameVal.toUpperCase(),
        category: activeCategory,
        date: new Date().toISOString().split('T')[0],
        size: selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : '1.2 MB',
        stNumber: stVal.toUpperCase(),
        year: yrVal,
        fileData: fileData, 
        chunkCount: chunkCount,
        ownerNip: currentUser.role === 'ADMIN' && selectedStaff ? selectedStaff.nip : currentUser.nip
      });
      
      setIsUploading(false); setUploadSuccess(true); setSelectedFileName(''); setSelectedFile(null);
      setTimeout(() => { setUploadSuccess(false); setModal({ type: null, data: null }); }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setModal({ type: 'error', data: { message: 'Terjadi kesalahan sistem, memori, atau jaringan saat mengunggah. Pastikan berkas Anda tidak rusak.' } });
    }
  };

  const openEditModal = () => {
    if (currentUser) {
      setEditForm({ name: currentUser.name, position: currentUser.position, rank: currentUser.rank, instansi: currentUser.instansi });
      setModal({ type: 'edit-profile', data: null });
    }
  };

  const handleSaveProfile = () => {
    setCurrentUser(prev => ({ 
      ...prev, 
      name: editForm.name.toUpperCase(), 
      position: editForm.position.toUpperCase(), 
      rank: editForm.rank.toUpperCase(), 
      instansi: editForm.instansi.toUpperCase() 
    }));
    setModal({ type: null, data: null });
  };

  const handleBgChange = (bgOption) => setLoginBg(bgOption);

  const handleCustomLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    const defaultLogo = getGDriveUrl(G_DRIVE_LOGO_ID) || "https://img.freepik.com/premium-vector/isometric-filing-cabinet-folders-boxes-illustration_1284-53906.jpg";
    setCustomLogo(defaultLogo);
    setLogoSize(100); 
    if (logoInputRef.current) logoInputRef.current.value = '';
    localStorage.removeItem('eArsip_customLogo');
  };

  /* --- RENDER BLOCKS --- */

  if (currentPage === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white font-garamond font-bold">
        <style>{globalStyles}</style>
        
        {/* Layer Belakang Tema G-Drive / Gradient Default */}
        <div className="absolute inset-0 z-0 transition-colors duration-1000 bg-gray-100">
            {G_DRIVE_BACKGROUND_ID && (
                <div className="absolute inset-0" style={{ backgroundImage: `url(${getGDriveUrl(G_DRIVE_BACKGROUND_ID)})`, backgroundSize: '450px', backgroundRepeat: 'repeat', backgroundPosition: 'center' }}></div>
            )}
            
            {/* Overlay Gradient agar gambar menyatu dengan warna tema pilihan */}
            <div className={`absolute inset-0 bg-gradient-to-br ${loginBg.gradient} ${G_DRIVE_BACKGROUND_ID ? 'opacity-80' : 'opacity-60'} transition-colors duration-1000`}></div>
        </div>

        {/* Layer Depan: Panel Login dg Animasi Klik */}
        <div className="max-w-[780px] w-full rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col md:flex-row z-10 uppercase relative min-h-[460px] bg-[#FDF5E6]/30 backdrop-blur-lg border border-white/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] cursor-default">
          
          {/* Sisi Kiri: Cream Transparan 30% */}
          <div className="w-full md:w-[45%] bg-transparent p-10 flex flex-col justify-center items-center text-center relative transition-all duration-300 border-r border-white/20">
            <div className="bg-white/30 p-2 rounded-[1.5rem] backdrop-blur-sm mb-6 shadow-[0_15px_30px_rgba(0,0,0,0.1)] border border-white/30 flex items-center justify-center overflow-hidden w-48 h-32 transform transition-all duration-500 hover:scale-105">
                <img 
                    src={customLogo} 
                    alt="Ilustrasi" 
                    className="object-contain transition-all duration-300 drop-shadow-md" 
                    style={{ 
                      width: `${logoSize}%`, 
                      height: `${logoSize}%`,
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }} 
                />
            </div>
            <h1 className="text-[24px] mb-4 uppercase tracking-tighter leading-tight text-gray-900 drop-shadow-sm">
              E-KAKAPE <br/> INSPEKTUR <br/> PEMBANTU WILAYAH <br/> 1
            </h1>
            <p className="text-gray-700 font-bold max-w-[220px] leading-relaxed text-[9px] uppercase mt-4 opacity-90 drop-shadow-sm">
              SISTEM MANAJEMEN DOKUMEN DIGITAL & KERTAS KERJA PENGAWASAN (KKP).
            </p>
          </div>

          {/* Sisi Kanan: Cream Transparan 30% */}
          <div className="w-full md:w-[55%] p-10 md:px-14 md:py-12 flex flex-col justify-center text-gray-800 uppercase bg-transparent relative backdrop-blur-sm transition-all duration-300">
            {loginStep === 'select' ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full h-full flex flex-col justify-center">
                    <div className="mb-8 text-center mt-2">
                        <h2 className="text-[22px] tracking-tighter uppercase leading-none text-gray-900 drop-shadow-sm">SELAMAT DATANG</h2>
                        <p className="text-gray-600 text-[8px] uppercase tracking-[0.25em] mt-2.5 leading-none">PILIH MODE AKSES SISTEM</p>
                    </div>
                    <div className="space-y-4">
                        <button onClick={() => setLoginStep('admin-form')} className="w-full bg-white/60 backdrop-blur-sm hover:bg-white/90 rounded-[1.25rem] p-3.5 flex items-center gap-4 border-[1.5px] border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 text-left uppercase group">
                            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 shrink-0 shadow-sm"><ShieldAlert size={18} strokeWidth={2.5}/></div>
                            <div className="flex-1">
                                <p className="text-[11px] tracking-wider leading-none text-gray-800 group-hover:text-cyan-800 transition-colors font-bold">MASUK SEBAGAI ADMIN</p>
                                <p className="text-[7.5px] text-gray-500 mt-1.5 leading-none uppercase">AKSES PENUH KELOLA PERSONEL</p>
                            </div>
                        </button>
                        <button onClick={() => setLoginStep('user-form')} className="w-full bg-white/60 backdrop-blur-sm hover:bg-white/90 rounded-[1.25rem] p-3.5 flex items-center gap-4 border-[1.5px] border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 text-left uppercase group">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all duration-300 shrink-0 shadow-sm"><UserCheck size={18} strokeWidth={2.5}/></div>
                            <div className="flex-1">
                                <p className="text-[11px] tracking-wider leading-none text-gray-800 group-hover:text-green-800 transition-colors font-bold">MASUK SEBAGAI USER</p>
                                <p className="text-[7.5px] text-gray-500 mt-1.5 leading-none uppercase">AKSES INTERNAL PEGAWAI</p>
                            </div>
                        </button>
                    </div>
                    <div className="mt-12 flex justify-center">
                      <div className="border-t border-gray-300/50 w-full pt-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none text-gray-700 drop-shadow-sm">INSPEKTUR PEMBANTU WILAYAH 1</p>
                      </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 w-full h-full flex flex-col justify-center">
                    <button onClick={() => { setLoginStep('select'); setLoginError(''); setNip(''); setPassword(''); setShowPassword(false); }} className="mb-6 flex items-center gap-2 text-[10px] text-cyan-700 uppercase tracking-widest hover:translate-x-[-4px] active:scale-95 transition-all leading-none"><ArrowLeft size={14}/> Kembali</button>
                    <div className="mb-6 text-center text-gray-800">
                        <h2 className="text-[22px] tracking-tighter uppercase leading-none text-gray-900 drop-shadow-sm">{loginStep === 'admin-form' ? 'Admin Login' : 'User Login'}</h2>
                        <p className="text-gray-600 text-[8px] uppercase tracking-[0.25em] mt-2.5 leading-none">Masukkan Kredensial Akses</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4 text-left uppercase">
                        {loginError && <div className="bg-red-50/90 backdrop-blur-sm text-red-600 p-3 rounded-xl text-[10px] border border-red-200 animate-bounce flex items-center gap-3 leading-tight uppercase"><AlertCircle size={16} className="shrink-0"/> {loginError}</div>}
                        <div className="space-y-1.5 group">
                            <label className="text-[9px] text-gray-600 uppercase tracking-widest ml-1 leading-none group-hover:text-cyan-700 transition-colors">NIP / USERNAME</label>
                            <input type="text" required value={nip} onChange={e => setNip(e.target.value)} className="w-full px-5 py-3.5 rounded-[1rem] border-[1.5px] border-white/60 focus:border-cyan-500 outline-none text-[12px] bg-white/60 backdrop-blur-sm text-gray-800 shadow-inner uppercase transition-all hover:bg-white/80 focus:bg-white/90" placeholder="MASUKKAN NIP" />
                        </div>
                        <div className="space-y-1.5 group">
                            <label className="text-[9px] text-gray-600 uppercase tracking-widest ml-1 leading-none group-hover:text-cyan-700 transition-colors">PASSWORD</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-3.5 rounded-[1rem] border-[1.5px] border-white/60 focus:border-cyan-500 outline-none text-[14px] font-sans tracking-widest bg-white/60 backdrop-blur-sm text-gray-800 shadow-inner transition-all hover:bg-white/80 focus:bg-white/90 pr-12" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-700 transition-colors focus:outline-none">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" style={globalGradientStyle} className="w-full py-4 rounded-[1rem] shadow-md hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 transition-all duration-300 text-[11px] tracking-[0.2em] uppercase mt-2 leading-none backdrop-blur-sm font-bold">Masuk</button>
                    </form>
                    <div className="mt-8 flex justify-center">
                      <div className="border-t border-gray-300/50 w-full pt-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none text-gray-700 drop-shadow-sm">INSPEKTUR PEMBANTU WILAYAH 1</p>
                      </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white font-garamond font-bold">
        <style>{globalStyles}</style>

        {/* Latar Belakang Sama dengan Halaman Login */}
        <div className="absolute inset-0 z-0 transition-colors duration-1000 bg-gray-100">
            {G_DRIVE_BACKGROUND_ID && (
                <div className="absolute inset-0" style={{ backgroundImage: `url(${getGDriveUrl(G_DRIVE_BACKGROUND_ID)})`, backgroundSize: '450px', backgroundRepeat: 'repeat', backgroundPosition: 'center' }}></div>
            )}
            <div className={`absolute inset-0 bg-gradient-to-br ${loginBg.gradient} ${G_DRIVE_BACKGROUND_ID ? 'opacity-80' : 'opacity-60'} transition-colors duration-1000`}></div>
        </div>

        {/* Panel Cream Transparan 30% */}
        <div className="max-w-md w-full bg-[#FDF5E6]/30 backdrop-blur-md p-16 rounded-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white/30 text-center z-10 uppercase transition-all duration-500 hover:scale-[1.01] relative overflow-hidden">
          
          {showWelcome ? (
              <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 py-8 min-h-[300px]">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce border-[3px] border-green-200">
                      <ShieldCheck size={48} className="text-green-600" />
                  </div>
                  <h2 className="text-3xl text-gray-900 tracking-tighter uppercase leading-none drop-shadow-sm">Selamat Datang</h2>
                  <p className="text-gray-600 font-bold mt-4 tracking-widest text-[10px] uppercase">Memuat Dashboard...</p>
              </div>
          ) : (
              <>
                  <div className={`w-24 h-24 bg-white/50 backdrop-blur-sm rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center shadow-inner border border-white/50 leading-none transition-transform duration-300 ${isLinked ? 'hover:scale-110 text-green-600' : 'hover:rotate-12 text-[#3c8dbc]'}`}>
                    {isLinked ? <ShieldCheck size={48} /> : <QrCode size={48} />}
                  </div>
                  <h2 className="text-2xl text-gray-900 mb-2 tracking-tighter uppercase leading-none text-center drop-shadow-sm">Verifikasi Keamanan</h2>
                  
                  {isLinked ? (
                    <div className="my-10 animate-in fade-in zoom-in duration-500">
                        <p className="text-gray-800 font-black text-xl tracking-widest mb-1 drop-shadow-sm bg-white/50 inline-block px-6 py-2 rounded-full border border-white/50 shadow-sm">e-Kakape Irban 1</p>
                        <div className="bg-green-50/90 backdrop-blur-md border-[1.5px] border-green-200/50 p-6 rounded-3xl shadow-sm text-center mt-6">
                            <div className="flex items-center justify-center gap-2 text-green-700">
                                <Lock size={16} />
                                <span className="text-[12px] font-black tracking-widest uppercase">Keamanan MFA Aktif</span>
                            </div>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-4 leading-relaxed bg-white/60 p-3 rounded-xl border border-white/50">
                                TERTAUT PADA EMAIL: <br/> <span className="text-green-700 text-[11px] block mt-1 lowercase font-black tracking-widest">{maskEmail(linkageInfo?.email || 'EMAIL ANDA')}</span>
                            </p>
                        </div>
                    </div>
                  ) : (
                    <div className="my-10 animate-in fade-in duration-500">
                         <div className="p-5 bg-white/50 backdrop-blur-sm border-[1.5px] border-white/50 rounded-[3rem] inline-block shadow-sm hover:border-gray-200 transition-colors">
                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getQrData())}`} alt="QR" className="w-48 h-48 rounded-2xl mix-blend-multiply" />
                         </div>
                         <div className="mt-8 space-y-2 text-left">
                             <label className="text-[9px] text-gray-800 uppercase tracking-widest ml-1 font-bold flex items-center gap-2"><Mail size={12}/> TAUTKAN AKUN GMAIL</label>
                             <input 
                                 type="email" 
                                 required 
                                 value={linkEmail} 
                                 onChange={e => setLinkEmail(e.target.value)} 
                                 className="w-full px-5 py-4 rounded-[1.5rem] border-[1.5px] border-white/60 focus:border-cyan-500 outline-none text-[12px] bg-white/60 backdrop-blur-sm text-gray-800 shadow-inner lowercase transition-all hover:bg-white/80 focus:bg-white/90 font-sans tracking-wide font-medium" 
                                 placeholder="wajib @gmail.com untuk keamanan" 
                             />
                         </div>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-10 uppercase text-center flex flex-col items-center">
                    <div className="flex flex-col items-center w-full">
                      <div className="flex justify-center gap-3">
                        {otp.map((digit, idx) => (
                          <input key={idx} id={`otp-${idx}`} type="text" maxLength="1" className={`w-12 h-16 text-center text-3xl border-[1.5px] border-gray-300/50 rounded-2xl focus:border-cyan-500 focus:-translate-y-1 hover:-translate-y-1 outline-none transition-all duration-300 shadow-sm bg-white/70 backdrop-blur-sm text-gray-800 ${otpError ? 'border-red-400' : 'border-gray-200/50'}`} value={digit} onChange={(e) => handleOtpChange(idx, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && idx > 0) { const prev = document.getElementById(`otp-${idx-1}`); if (prev) prev.focus(); } }} />
                        ))}
                      </div>
                      {otpError && <div className="mt-5 text-red-600 font-bold bg-red-50/80 px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider animate-shake text-center backdrop-blur-sm">{otpError}</div>}
                    </div>
                    <button type="submit" disabled={verifying} style={globalGradientStyle} className="w-full py-5 rounded-[1.5rem] shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50">
                      {verifying ? <RefreshCw size={18} className="animate-spin"/> : <ShieldCheck size={18}/>} {verifying ? "PROSES..." : "KONFIRMASI MFA"}
                    </button>
                  </form>
              </>
          )}
        </div>
      </div>
    );
  }

  /* Main App Return */
  return (
    <div className="min-h-screen bg-[#EDD2A4] flex flex-col overflow-hidden leading-none text-left relative uppercase font-garamond font-bold">
      <style>{globalStyles}</style>

      {/* Header Atas (Logo & Profil Pengguna) */}
      <header className={`h-20 shrink-0 bg-gradient-to-r ${loginBg.gradient} text-white flex items-center px-6 lg:px-8 justify-between shadow-md z-40 relative transition-colors duration-1000`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl p-1.5 shadow-inner border border-white/30 hidden sm:flex items-center justify-center">
              <img src={customLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div className="flex flex-col justify-center mt-0.5">
              <h1 className="text-xl lg:text-2xl tracking-tighter uppercase font-black drop-shadow-md leading-none">
                  E-KAKAPE
              </h1>
              <span className="opacity-90 font-bold tracking-widest text-[8px] lg:text-[9px] mt-1.5 leading-none uppercase drop-shadow-sm">
                  INSPEKTUR PEMBANTU WILAYAH I
              </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-6 text-[10px] lg:text-[11px] uppercase tracking-widest">
          <div className="flex items-center gap-4">
              <div className="text-right leading-tight hidden sm:block drop-shadow-sm">
                  <p className="font-black text-[12px] lg:text-[13px]">{currentUser?.name}</p>
                  <p className="opacity-90 mt-1">{currentUser?.nip}</p>
              </div>
              <div className="w-10 h-14 lg:w-12 lg:h-16 rounded-xl overflow-hidden border-[1.5px] border-white/30 shadow-lg bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform shrink-0">
                  {profileImage ? <img src={profileImage} className="w-full h-full object-cover" alt="Avatar" /> : <User size={24} className="text-white" />}
              </div>
              <button onClick={handleLogout} className="ml-1 w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 border border-red-400/50 backdrop-blur-sm shrink-0" title="Sign Out">
                  <LogOut size={18} className="lg:w-5 lg:h-5" />
              </button>
          </div>
        </div>
      </header>

      {/* Navigasi Horizontal Biru Gelap (Ala DJP) */}
      <nav className="bg-[#1e293b] text-white flex items-center px-4 lg:px-8 shadow-md z-30 overflow-x-auto whitespace-nowrap hide-scrollbar shrink-0">
        <button 
            onClick={() => {setCurrentPage('dashboard'); setActiveCategory(null); setSelectedStaff(null);}} 
            className={`px-5 py-4 flex items-center gap-2 transition-all duration-300 border-b-[3px] hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 group ${currentPage === 'dashboard' && !activeCategory ? 'border-cyan-400 text-cyan-400 bg-white/5' : 'border-transparent text-gray-300 hover:text-white'}`}>
            <LayoutDashboard size={16} className="transition-transform duration-300 group-hover:scale-110" /> <span className="text-[11px] uppercase tracking-widest font-bold mt-0.5 transition-colors">DASHBOARD UTAMA</span>
        </button>
        <button 
            onClick={() => {setCurrentPage('dashboard'); setActiveCategory('KERTAS KERJA REVIU'); setSelectedStaff(null);}} 
            className={`px-5 py-4 flex items-center gap-2 transition-all duration-300 border-b-[3px] hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 group ${currentPage === 'dashboard' && activeCategory === 'KERTAS KERJA REVIU' ? 'border-cyan-400 text-cyan-400 bg-white/5' : 'border-transparent text-gray-300 hover:text-white'}`}>
            <FileSearch size={16} className="transition-transform duration-300 group-hover:scale-110" /> <span className="text-[11px] uppercase tracking-widest font-bold mt-0.5 transition-colors">KERTAS KERJA REVIU</span>
        </button>
        <button 
            onClick={() => {setCurrentPage('dashboard'); setActiveCategory('KERTAS KERJA EVALUASI'); setSelectedStaff(null);}} 
            className={`px-5 py-4 flex items-center gap-2 transition-all duration-300 border-b-[3px] hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 group ${currentPage === 'dashboard' && activeCategory === 'KERTAS KERJA EVALUASI' ? 'border-cyan-400 text-cyan-400 bg-white/5' : 'border-transparent text-gray-300 hover:text-white'}`}>
            <CheckCircle size={16} className="transition-transform duration-300 group-hover:scale-110" /> <span className="text-[11px] uppercase tracking-widest font-bold mt-0.5 transition-colors">KERTAS KERJA EVALUASI</span>
        </button>
        <button 
            onClick={() => setCurrentPage('profile')} 
            className={`px-5 py-4 flex items-center gap-2 transition-all duration-300 border-b-[3px] hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 group ${currentPage === 'profile' ? 'border-cyan-400 text-cyan-400 bg-white/5' : 'border-transparent text-gray-300 hover:text-white'}`}>
            <User size={16} className="transition-transform duration-300 group-hover:scale-110" /> <span className="text-[11px] uppercase tracking-widest font-bold mt-0.5 transition-colors">PROFIL</span>
        </button>
        {currentUser?.role === 'ADMIN' && (
            <button 
                onClick={() => setCurrentPage('settings')} 
                className={`px-5 py-4 flex items-center gap-2 transition-all duration-300 border-b-[3px] hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 group ${currentPage === 'settings' ? 'border-cyan-400 text-cyan-400 bg-white/5' : 'border-transparent text-gray-300 hover:text-white'}`}>
                <Settings size={16} className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" /> <span className="text-[11px] uppercase tracking-widest font-bold mt-0.5 transition-colors">PENGATURAN TAMPILAN</span>
            </button>
        )}
      </nav>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col overflow-hidden text-gray-800 leading-none z-10 text-left uppercase relative bg-transparent">
        <main className="p-6 md:p-10 lg:p-12 flex-1 overflow-y-auto bg-[#EDD2A4] text-left uppercase relative">
          {currentPage === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-1000 text-left uppercase">
              {!activeCategory ? (
                <>
                  <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 text-left uppercase text-gray-800">
                    <div className="text-left text-gray-800 uppercase">
                      <h2 className="text-4xl tracking-tighter uppercase leading-none text-left drop-shadow-sm">DASHBOARD UTAMA</h2>
                      <p className="text-[13px] text-gray-700 uppercase tracking-[0.5em] mt-4 border-l-4 border-[#3c8dbc] pl-5 leading-tight text-left bg-[#FDF5E6]/30 backdrop-blur-sm p-2 rounded-r-lg">
                        INTERNAL DOCUMENT MANAGEMENT SYSTEM <br/><span className="text-gray-600 uppercase text-left leading-none font-bold">INSPEKTUR PEMBANTU WILAYAH 1</span>
                      </p>
                    </div>
                    <div className="bg-[#FDF5E6]/30 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-[#FDF5E6]/50 text-[11px] text-gray-800 uppercase tracking-[0.2em] flex items-center gap-4 leading-none hover:bg-[#FDF5E6]/50 transition-colors duration-300 cursor-default">
                      <LayoutDashboard size={16} className="text-[#3c8dbc]"/> HOME <ChevronRight size={12}/> <span className="text-gray-900 font-bold">DASHBOARD</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 mb-12 text-left uppercase">
                    {STATS_CONFIG.map((stat, idx) => (
                      <div key={idx} onClick={() => { setActiveCategory(stat.label); setActiveYear('SEMUA TAHUN'); }} style={stat.style} className={`rounded-[2rem] shadow-lg relative overflow-hidden group transform hover:-translate-y-2 transition-all duration-300 cursor-pointer active:scale-95 hover:shadow-2xl uppercase`}>
                        <div className="p-8 flex items-center justify-between relative z-10 text-white uppercase text-left">
                          <div className="text-left uppercase text-white leading-none">
                            <h3 className="text-5xl mb-2 tracking-tighter drop-shadow-lg text-white leading-none uppercase transform group-hover:scale-105 transition-transform duration-300">{stat.count}</h3>
                            <p className="text-[26px] uppercase tracking-[0.1em] opacity-90 text-white leading-none font-bold">{stat.label}</p>
                          </div>
                          <stat.icon size={80} className="absolute right-[-10px] top-[-10px] opacity-20 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 text-white uppercase leading-none drop-shadow-xl" />
                        </div>
                        <div className="bg-black/15 py-4 text-[11px] text-center uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 text-white leading-none group-hover:bg-black/25 backdrop-blur-sm">
                           <ChevronRight size={14} className="uppercase group-hover:translate-x-1 transition-transform"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="animate-in zoom-in duration-500 text-left uppercase">
                  <div className="mb-10 flex items-center justify-between text-left uppercase">
                    <button onClick={() => { if(selectedStaff) setSelectedStaff(null); else setActiveCategory(null); }} className="flex items-center gap-3 bg-[#FDF5E6]/30 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-md border border-[#FDF5E6]/50 text-[12px] uppercase text-cyan-800 hover:bg-[#FDF5E6]/50 transition-all duration-300 active:scale-95 hover:shadow-lg hover:-translate-y-1 leading-none text-left">
                        <ArrowLeft size={18} className="uppercase"/> {selectedStaff ? 'KEMBALI KE DAFTAR PEGAWAI' : 'KEMBALI KE DASHBOARD'}
                    </button>
                    <div className="text-right leading-tight text-gray-800 uppercase bg-[#FDF5E6]/30 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                        <h3 className="text-3xl tracking-tighter uppercase text-right leading-none drop-shadow-sm">{activeCategory}</h3>
                        <p className="text-[11px] text-gray-800 uppercase tracking-widest mt-2 text-right leading-none font-bold">
                            {currentUser?.role === 'ADMIN' 
                                ? (selectedStaff ? `ARSIP: ${selectedStaff.name}` : 'PILIH PEGAWAI')
                                : `ARSIP: ${currentUser?.name}`}
                        </p>
                    </div>
                  </div>

                  {currentUser.role === 'ADMIN' && !selectedStaff ? (
                      <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 text-left uppercase">
                          <div className="bg-[#FDF5E6]/50 backdrop-blur-sm p-6 rounded-[2rem] mb-8 flex items-center gap-6 text-left uppercase leading-none transition-all duration-300 shadow-sm border border-transparent">
                              <Users size={32} className="text-gray-700 uppercase leading-none"/>
                              <div className="text-left uppercase">
                                  <h4 className="text-xl tracking-tighter uppercase leading-none text-left text-gray-800">DAFTAR PERSONEL WILAYAH 1</h4>
                                  <p className="text-[12px] text-gray-600 uppercase tracking-widest mt-1.5 text-left leading-none font-bold">PILIH PEGAWAI UNTUK MENGAKSES DATABASE BERKAS</p>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 text-left uppercase">
                             {INITIAL_USER_DATABASE.map((staff, sIdx) => {
                                  const staffFileCount = files.filter(f => f.category === activeCategory && f.ownerNip === staff.nip).length;
                                  return (
                                      <div key={sIdx} onClick={() => setSelectedStaff(staff)} className="bg-[#FDF5E6]/30 backdrop-blur-md p-6 rounded-[2rem] border border-transparent shadow-sm flex items-center justify-between group hover:bg-[#FDF5E6]/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 active:scale-[0.98] hover:shadow-md text-left uppercase leading-none">
                                         <div className="flex items-center gap-6 text-left uppercase">
                                             <div className="w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center text-gray-800 group-hover:bg-white/80 transition-all duration-300 uppercase leading-none shadow-sm"><User size={28} className="uppercase transform group-hover:scale-110 transition-transform duration-300"/></div>
                                             <div className="text-left uppercase">
                                                 <p className="text-[16px] tracking-tighter text-gray-800 transition-colors duration-300 text-left uppercase leading-none">{staff.name}</p>
                                                 <p className="text-[11px] text-gray-600 mt-1 tracking-widest text-left uppercase leading-none font-bold">{staff.position} • {staff.nip}</p>
                                             </div>
                                         </div>
                                         <div className="flex items-center gap-8 text-right uppercase">
                                             <div className="text-right uppercase leading-none">
                                                 <p className="text-[11px] text-gray-700 tracking-widest mb-1 text-right uppercase leading-none font-bold">TOTAL DATA</p>
                                                 <p className={`text-2xl ${staffFileCount > 0 ? 'text-gray-800' : 'text-gray-500'} text-right uppercase leading-none transform group-hover:scale-105 transition-all`}>{staffFileCount} BERKAS</p>
                                             </div>
                                             <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center text-gray-600 group-hover:bg-white/80 transition-all duration-300 shadow-sm uppercase leading-none"><ChevronRight size={24} className="uppercase group-hover:translate-x-1 transition-transform"/></div>
                                         </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  ) : (
                    <div className="bg-[#FDF5E6]/30 backdrop-blur-md rounded-[3.5rem] shadow-lg overflow-hidden text-gray-800 uppercase text-left transition-all duration-500 hover:shadow-xl border border-transparent">
                        <div className="p-10 border-b border-[#FDF5E6]/50 bg-transparent flex flex-col lg:flex-row gap-8 items-center justify-between text-left uppercase leading-none">
                            <div className="flex items-center gap-4 text-left uppercase leading-none">
                                <div className="p-4 rounded-3xl text-white shadow-xl shadow-blue-100 uppercase leading-none transition-transform hover:scale-110 duration-300" style={globalGradientStyle}><Archive size={24} className="uppercase leading-none"/></div>
                                <h4 className="uppercase tracking-tighter text-2xl leading-none text-gray-800 text-left">DATABASE BERKAS</h4>
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto text-left uppercase leading-none">
                                <div className="relative flex-1 lg:w-80 text-left leading-none uppercase group">
                                    <Search className="absolute left-5 top-4 text-gray-600 uppercase leading-none transition-colors" size={20} />
                                    <input type="text" placeholder={`CARI BERKAS...`} className="pl-14 pr-6 py-4 border border-white/50 rounded-3xl text-sm outline-none w-full bg-[#FDF5E6]/50 backdrop-blur-sm text-gray-800 shadow-inner uppercase text-left leading-none hover:bg-white/70 font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                </div>
                                <button onClick={() => {setSelectedFileName(''); setModal({ type: 'upload', data: null })}} style={customAddButtonStyle} className={customAddButtonClass}><Plus size={20} className="uppercase leading-none"/> TAMBAH</button>
                            </div>
                        </div>

                        <div className="px-10 py-6 bg-transparent border-b border-[#FDF5E6]/50 flex items-center gap-5 relative text-gray-800 uppercase leading-none">
                            <span className="text-[12px] uppercase tracking-[0.2em] flex items-center gap-3 leading-none font-bold"><Filter size={16} className="uppercase leading-none"/> FILTER:</span>
                            <div className="relative" ref={yearMenuRef}>
                                <button onClick={() => setShowYearMenu(!showYearMenu)} className={`px-8 py-3 rounded-2xl text-[12px] uppercase transition-all duration-300 flex items-center gap-4 border-[1.5px] leading-none active:scale-95 ${activeYear === 'SEMUA TAHUN' ? 'bg-[#FDF5E6]/50 backdrop-blur-sm text-gray-800 border-white/50 hover:bg-white/70 font-bold' : 'text-white shadow-lg hover:opacity-90'}`} style={activeYear !== 'SEMUA TAHUN' ? globalGradientStyle : {}}>{activeYear} <ChevronDown size={16} className={`transition-transform duration-300 uppercase ${showYearMenu ? 'rotate-180' : ''}`} /></button>
                                {showYearMenu && (
                                    <div className="absolute top-full left-0 mt-3 w-52 bg-[#FDF5E6]/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 p-2 text-left uppercase leading-none">
                                       {YEARS.map(y => (
                                           <button key={y} onClick={() => { setActiveYear(y); setShowYearMenu(false); }} className={`w-full text-left px-5 py-3.5 text-[12px] uppercase rounded-2xl transition-all duration-300 leading-none active:scale-95 font-bold ${activeYear === y ? 'bg-white/50 text-gray-800' : 'text-gray-700 hover:bg-[#FDF5E6]/50 hover:translate-x-1'}`}>{y}</button>
                                        ))}
                                   </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto text-left uppercase text-gray-800 leading-none p-4">
                            <table className="w-full text-left text-sm uppercase text-gray-800 leading-none border-separate border-spacing-y-2">
                            <thead className="text-gray-700 font-bold uppercase text-[12px] tracking-widest leading-none">
                                <tr>
                                <th className="px-10 py-6 w-12 text-center uppercase leading-none">NO</th>
                                <th className="px-10 py-6 text-left uppercase leading-none">INFORMASI DOKUMEN KKP</th>
                                <th className="px-10 py-6 text-gray-600 text-left uppercase leading-none">NOMOR SURAT TUGAS</th>
                                <th className="px-10 py-6 text-center uppercase leading-none">KLASIFIKASI</th>
                                <th className="px-10 py-6 text-center uppercase leading-none">OPSI</th>
                                </tr>
                            </thead>
                            <tbody className="text-left uppercase leading-none">
                               {filteredFiles.map((file, idx) => (
                                <tr key={file.id} className="bg-[#FDF5E6]/40 hover:bg-[#FDF5E6]/60 backdrop-blur-sm transition-colors duration-300 group cursor-default text-left uppercase text-gray-800 leading-none relative shadow-sm rounded-3xl overflow-hidden border border-transparent hover:border-white/50">
                                    <td className="px-10 py-8 text-gray-600 font-bold text-center leading-none uppercase rounded-l-3xl">{idx + 1}</td>
                                    <td className="px-10 py-8 text-left uppercase leading-none">
                                        <div className="flex items-center gap-5 text-left uppercase leading-none">
                                            <button onClick={() => handlePreview(file)} disabled={previewingId === file.id} className="p-4 bg-white/80 rounded-2xl shadow-sm border border-[#FDF5E6]/50 hover:bg-cyan-50 hover:border-cyan-200 group-hover:scale-110 transition duration-300 group-hover:shadow-md leading-none text-left cursor-pointer active:scale-95 disabled:opacity-50 relative" title="Klik untuk Pratinjau Dokumen">
                                                {previewingId === file.id ? <RefreshCw size={24} className="text-cyan-600 animate-spin"/> : <FileIcon size={24} className="text-gray-600 opacity-70 group-hover:text-cyan-600 group-hover:opacity-100 uppercase leading-none transition-colors"/>}
                                            </button>
                                            <div className="overflow-hidden text-left uppercase leading-none">
                                               <p className="tracking-tighter uppercase text-gray-800 transition-colors truncate max-w-xs text-left leading-none font-bold">{file.name}</p>
                                               <p className="text-[11px] text-gray-600 font-bold flex items-center gap-2 mt-2.5 uppercase text-left leading-none"><Clock size={12} className="uppercase leading-none"/> {file.date} | {file.size}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-left uppercase leading-none">
                                        <p className="text-[13px] text-gray-700 uppercase flex items-center gap-3 text-left leading-none font-bold"><Hash size={14} className="text-gray-400 opacity-50 uppercase leading-none"/> {file.stNumber}</p>
                                       <span className="text-[10px] text-gray-500 font-bold uppercase mt-2 block text-left leading-none">ANGGARAN: {file.year}</span>
                                    </td>
                                    <td className="px-10 py-8 text-center uppercase leading-none">
                                       <span className="bg-white/60 px-5 py-2.5 rounded-xl text-[11px] text-gray-700 uppercase tracking-widest border border-[#FDF5E6]/50 shadow-sm inline-block text-center group-hover:shadow-md transition-shadow font-bold">{file.category}</span>
                                    </td>
                                    <td className="px-10 py-8 text-center uppercase leading-none rounded-r-3xl">
                                        <div className="flex justify-center gap-3 text-center leading-none">
                                           <button onClick={() => handleDownload(file)} disabled={downloadingId === file.id} className="bg-white/60 text-gray-600 border border-[#FDF5E6]/50 p-3 rounded-2xl hover:bg-white/90 transition-all duration-300 hover:shadow-md active:scale-90 uppercase shadow-sm disabled:opacity-50 hover:-translate-y-1" title="DOWNLOAD">
                                              {downloadingId === file.id ? <RefreshCw size={18} className="uppercase animate-spin"/> : <Download size={18} className="uppercase"/>}
                                           </button>
                                           <button onClick={() => setModal({ type: 'detail', data: file })} className="bg-white/60 text-gray-600 border border-[#FDF5E6]/50 p-3 rounded-2xl hover:bg-white/90 transition-all duration-300 hover:shadow-md active:scale-90 uppercase shadow-sm hover:-translate-y-1" title="INFO"><Info size={18} className="uppercase"/></button>
                                           <button onClick={() => setModal({ type: 'delete', data: file })} className="bg-white/60 text-red-500 border border-[#FDF5E6]/50 p-3 rounded-2xl hover:bg-red-50 transition-all duration-300 hover:shadow-md active:scale-90 uppercase shadow-sm hover:-translate-y-1" title="HAPUS"><Trash2 size={18} className="uppercase"/></button>
                                        </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                           {filteredFiles.length === 0 && (
                                <div className="p-32 text-center text-gray-500 uppercase leading-none">
                                    <div className="inline-flex p-8 bg-[#FDF5E6]/50 rounded-full mb-8 text-gray-400 animate-pulse leading-none shadow-sm"><FileSearch size={64} className="uppercase leading-none"/></div>
                                    <p className="text-gray-600 text-sm tracking-[0.5em] text-center leading-none font-bold">BELUM ADA DATA</p>
                                </div>
                            )}
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentPage === 'settings' && currentUser?.role === 'ADMIN' && (
           <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-1000 text-gray-800 uppercase text-left leading-none pb-20">
                <div className="mb-12 text-left text-gray-800 leading-none bg-[#FDF5E6]/30 backdrop-blur-sm p-4 rounded-3xl border border-white/20">
                  <h2 className="text-4xl tracking-tighter uppercase text-gray-800 text-left drop-shadow-sm">PENGATURAN TAMPILAN</h2>
                  <p className="text-[13px] text-gray-700 font-bold uppercase tracking-[0.5em] mt-4 border-l-4 border-gray-400 pl-5 leading-tight text-left">SESUAIKAN LATAR BELAKANG & LOGO HALAMAN LOGIN</p>
                </div>
                
                <div className="bg-[#FDF5E6]/30 backdrop-blur-md rounded-[4rem] p-16 shadow-sm border border-transparent relative overflow-hidden text-left uppercase text-gray-800 leading-none transition-all duration-500 hover:shadow-md">
                    
                    {/* Bagian Kustomisasi Logo */}
                    <div className="mb-16">
                        <h3 className="text-2xl uppercase tracking-tighter mb-6 text-gray-800 text-left leading-none">KUSTOMISASI LOGO/GAMBAR LOGIN</h3>
                        <p className="text-[11px] text-gray-600 font-bold uppercase tracking-widest mb-8 leading-relaxed">UNGGAH GAMBAR UNTUK MENGGANTIKAN ILUSTRASI DEFAULT DI ATAS JUDUL PADA PANEL LOGIN.</p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        ref={logoInputRef}
                                        onChange={handleCustomLogoUpload}
                                    />
                                    <button 
                                        onClick={() => logoInputRef.current?.click()}
                                        className="w-full sm:w-auto px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white text-[12px] rounded-2xl shadow-sm uppercase tracking-widest transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Upload size={18} /> UNGGAH LOGO
                                    </button>
                                    
                                    <button 
                                        onClick={handleResetLogo}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/60 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 text-gray-800 font-bold text-[12px] border border-[#FDF5E6]/50 rounded-2xl shadow-sm uppercase tracking-widest transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Trash2 size={18} /> RESET LOGO
                                    </button>
                                </div>

                                {/* Slider Jarak/Zoom Logo */}
                                <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-[#FDF5E6]/60 transition-all duration-300 hover:shadow-md">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[13px] uppercase tracking-widest text-gray-800 font-bold flex items-center gap-2">
                                           <Search size={14} className="text-gray-500"/> UKURAN / ZOOM LOGO
                                        </label>
                                        <span className="text-[13px] bg-white px-3 py-1 rounded-lg text-gray-600 shadow-sm border border-gray-100">{logoSize}%</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[11px] text-gray-600 font-bold">KECIL</span>
                                        <input 
                                            type="range" 
                                            min="30" 
                                            max="150" 
                                            step="5"
                                            value={logoSize} 
                                            onChange={(e) => setLogoSize(Number(e.target.value))}
                                            className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-600 hover:bg-gray-400 transition-colors"
                                        />
                                        <span className="text-[11px] text-gray-600 font-bold">BESAR</span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-4 normal-case tracking-normal leading-relaxed font-bold">Geser slider untuk menyesuaikan ukuran logo di dalam kotaknya.</p>
                                </div>
                            </div>

                            {/* Preview Logo */}
                            <div className="flex flex-col items-center justify-center p-6 bg-[#FDF5E6]/50 backdrop-blur-md rounded-3xl relative overflow-hidden group min-h-[200px] border border-white/50 transition-transform duration-500 hover:scale-[1.02] shadow-inner">
                                <p className="text-[9px] font-black text-gray-800 uppercase tracking-widest mb-4 z-10 bg-white/60 px-4 py-1 rounded-full backdrop-blur-sm border border-[#FDF5E6]/50 shadow-sm">PREVIEW PADA PANEL KIRI:</p>
                                <div className="bg-white/40 p-2 rounded-[1.5rem] backdrop-blur-sm shadow-[0_15px_30px_rgba(0,0,0,0.1)] border border-[#FDF5E6]/50 flex items-center justify-center overflow-hidden w-48 h-32 relative z-10 transition-transform duration-500 group-hover:scale-110">
                                    <img 
                                        src={customLogo} 
                                        alt="Preview Logo" 
                                        className="object-contain drop-shadow-md transition-all duration-300" 
                                        style={{ 
                                          width: `${logoSize}%`, 
                                          height: `${logoSize}%`,
                                          maxWidth: '100%',
                                          maxHeight: '100%'
                                        }} 
                                    />
                                </div>
                                <h1 className="text-[16px] mt-6 text-gray-900 font-bold text-center leading-tight drop-shadow-sm">E-KAKAPE <br/> INSPEKTUR PEMBANTU...</h1>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/40 pt-16 mb-16">
                        <h3 className="text-2xl uppercase tracking-tighter mb-8 text-gray-800 text-left leading-none">PILIH TEMA LOGIN</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                           {LOGIN_BGS.map((bg) => (
                               <div 
                                  key={bg.id} 
                                  onClick={() => handleBgChange(bg)}
                                  className={`cursor-pointer rounded-3xl overflow-hidden border-[1.5px] transition-all duration-300 transform hover:-translate-y-2 active:scale-95 ${loginBg.id === bg.id ? 'border-gray-500 shadow-lg scale-105' : 'border-transparent hover:border-white/50 shadow-sm hover:shadow-md'}`}
                               >
                                   {/* Preview Mini dari Halaman Login */}
                                   <div className="h-40 w-full relative overflow-hidden group bg-gray-100">
                                       {/* Gradien Preview */}
                                       <div className={`absolute inset-0 bg-gradient-to-br ${bg.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-500`}></div>
                                       {/* Kotak Dummy Panel */}
                                       <div className="absolute inset-4 bg-[#FDF5E6]/30 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/40 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                                           <span className="text-gray-800 font-bold text-[12px] tracking-widest drop-shadow-sm">PREVIEW PANEL</span>
                                       </div>
                                   </div>
                                   <div className={`p-4 text-center transition-colors duration-300 ${loginBg.id === bg.id ? 'bg-gray-500 text-white' : 'bg-white/50 backdrop-blur-sm text-gray-800 group-hover:bg-white/70 border-t border-[#FDF5E6]/50'}`}>
                                       <p className="text-[12px] uppercase tracking-widest font-bold">{bg.name}</p>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
           </div>
          )}

          {currentPage === 'profile' && (
           <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-1000 text-gray-800 uppercase text-left leading-none">
                <div className="mb-12 text-left text-gray-800 leading-none bg-[#FDF5E6]/30 backdrop-blur-sm p-4 rounded-3xl border border-white/20">
                  <h2 className="text-4xl tracking-tighter uppercase text-gray-800 text-left drop-shadow-sm">INFORMASI PENGGUNA</h2>
                </div>
                
                <div className="bg-[#FDF5E6]/30 backdrop-blur-md rounded-[4rem] p-16 relative overflow-hidden text-left text-gray-800 leading-none transition-all duration-500 border border-[#FDF5E6]/50">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-16 text-left uppercase leading-none">
                        <div className="relative flex-shrink-0 text-left uppercase leading-none text-gray-200 group">
                            <div className="w-48 h-64 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-sm overflow-hidden relative text-gray-400 text-left leading-none transition-transform duration-500 group-hover:scale-105 border-[1.5px] border-white/50">
                                {profileImage ? <img src={profileImage} className="w-full h-full object-cover text-left leading-none transition-transform duration-500 group-hover:scale-110" alt="Profile" /> : <User size={80} className="text-gray-500 text-left leading-none transition-transform duration-500 group-hover:scale-110" />}
                            </div>
                            <button onClick={() => setModal({ type: 'photo-options', data: null })} style={globalGradientStyle} className="absolute -bottom-3 -right-3 w-14 h-14 text-white rounded-2xl flex items-center justify-center shadow-md transform hover:scale-110 active:scale-95 transition-all leading-none uppercase z-10"><Plus size={28} className="uppercase"/></button>
                        </div>
                        
                        <div className="flex-1 w-full text-left leading-tight text-gray-800 uppercase">
                            <h3 className="text-4xl uppercase tracking-tighter mb-4 text-gray-800 text-left leading-none drop-shadow-sm">{currentUser?.name}</h3>
                            <p className="text-gray-600 text-sm uppercase tracking-[0.3em] mb-12 inline-block border-b-[2px] border-gray-300 pb-4 text-left leading-none font-bold">{currentUser?.position}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10 max-w-3xl text-left uppercase text-gray-700 leading-none">
                                <div className="text-left pl-2 uppercase leading-none transition-transform duration-300 hover:translate-x-2">
                                    <p className="text-[12px] text-gray-500 uppercase tracking-widest mb-2 font-bold">NIP</p>
                                    <p className="text-[17px] text-gray-900 tracking-wider uppercase flex items-center gap-3 font-mono text-left font-black">{currentUser?.nip}</p>
                                </div>
                                <div className="text-left pl-2 uppercase leading-none transition-transform duration-300 hover:translate-x-2">
                                    <p className="text-[12px] text-gray-500 uppercase tracking-widest mb-2 font-bold">GOLONGAN</p>
                                    <p className="text-[17px] text-gray-900 tracking-wider uppercase flex items-center gap-3 text-left font-black">{currentUser?.rank}</p>
                                </div>
                                <div className="text-left pl-2 uppercase leading-none transition-transform duration-300 hover:translate-x-2">
                                    <p className="text-[12px] text-gray-500 uppercase tracking-widest mb-2 font-bold">INSTANSI</p>
                                    <p className="text-[17px] text-gray-900 tracking-wider uppercase flex items-center gap-3 text-left font-black">INSPEKTORAT KABUPATEN SIGI</p>
                                </div>
                                <div className="text-left pl-2 uppercase leading-none transition-transform duration-300 hover:translate-x-2">
                                    <p className="text-[12px] text-gray-500 uppercase tracking-widest mb-2 font-bold">STATUS MFA</p>
                                    <p className="text-[17px] text-gray-900 tracking-wider uppercase flex items-center gap-3 text-left font-black">AKTIF <ShieldCheck size={20} className="text-green-600 animate-pulse" /></p>
                                </div>
                            </div>
                            
                            <div className="mt-20 flex gap-6 text-left uppercase leading-none">
                                <button onClick={openEditModal} style={globalGradientStyle} className="px-12 py-5 rounded-3xl shadow-lg hover:shadow-xl uppercase tracking-[0.2em] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center gap-4 text-left font-bold"><Edit3 size={18} className="text-left leading-none"/> EDIT PROFIL</button>
                                <button className="px-12 py-5 bg-[#FDF5E6]/50 backdrop-blur-sm hover:bg-[#FDF5E6]/80 text-gray-800 hover:text-gray-900 text-[14px] rounded-3xl shadow-sm hover:shadow-md uppercase tracking-[0.2em] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 text-left font-bold border border-transparent">SINKRONISASI DATA</button>
                            </div>
                        </div>
                    </div>
                </div>
           </div>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}
      <Modal isOpen={modal.type === 'delete'} onClose={() => setModal({ type: null, data: null })} title="SECURITY CHECK">
        <div className="text-center py-6 uppercase text-gray-800 leading-none shadow-none">
            <div className="w-28 h-28 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner border-[3px] border-red-200 text-center animate-pulse"><Trash2 size={56} className="uppercase leading-none text-center"/></div>
            <p className="text-lg px-8 uppercase tracking-tighter text-gray-800 leading-tight text-center drop-shadow-sm">ANDA AKAN MENGHAPUS DOKUMEN SECARA PERMANEN <br/><b className="text-red-600 text-xl block mt-4 tracking-normal text-center">"{modal.data?.name}"</b></p>
            <div className="flex flex-col gap-5 mt-14 text-center leading-none">
                <button onClick={handleConfirmDelete} className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-[1.5rem] shadow-xl hover:shadow-2xl text-[14px] tracking-[0.3em] uppercase transition-all transform hover:-translate-y-1 active:scale-95 shadow-red-100 text-center">YA, HAPUS SEKARANG</button>
                <button onClick={() => setModal({ type: null, data: null })} className="w-full py-6 text-gray-700 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm rounded-[1.5rem] border border-transparent hover:border-white/50 text-[14px] uppercase tracking-widest transition-all active:scale-95 text-center font-bold">BATALKAN AKSI</button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={modal.type === 'error'} onClose={() => setModal({ type: null, data: null })} title="PERINGATAN SISTEM">
        <div className="text-center py-6 uppercase text-gray-800 leading-none">
            <div className="w-28 h-28 bg-yellow-50/80 backdrop-blur-sm text-yellow-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner animate-pulse border-[3px] border-yellow-200 text-center"><AlertCircle size={56} className="uppercase leading-none text-center"/></div>
            <p className="text-lg px-8 uppercase tracking-tighter text-gray-800 leading-tight text-center drop-shadow-sm">{modal.data?.message}</p>
            <button onClick={() => setModal({ type: null, data: null })} className="w-full py-6 mt-10 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-[1.5rem] shadow-xl hover:shadow-2xl text-[14px] tracking-[0.3em] uppercase transition-all transform hover:-translate-y-1 active:scale-95 shadow-yellow-100 text-center">MENGERTI</button>
        </div>
      </Modal>

      <Modal isOpen={modal.type === 'upload'} onClose={() => { if(!isUploading && !uploadSuccess) setModal({ type: null, data: null }); }} title="PEMUATAN ARSIP KKP">
         <div className="space-y-8 relative min-h-[450px] flex flex-col justify-center text-center uppercase text-gray-800 leading-none">
            {uploadSuccess ? (
               <div className="flex flex-col items-center animate-in zoom-in duration-500 py-10 text-center uppercase leading-none">
                 <div className="w-32 h-32 bg-green-50/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner animate-bounce border-[3px] border-green-200 text-center"><Check size={64} className="text-[#00a65a] stroke-[4px] text-center" /></div>
                 <h3 className="text-4xl text-[#00a65a] tracking-tighter mb-4 text-center drop-shadow-sm">BERHASIL</h3>
                 <p className="text-[14px] text-gray-600 uppercase tracking-[0.4em] text-center font-bold">DOKUMEN TERKIRIM KE CLOUD</p>
               </div>
            ) : (
               <div className="space-y-6 text-left uppercase leading-none">
                 <div className="space-y-3 text-left uppercase leading-none group">
                   <label className="text-[12px] text-gray-700 uppercase tracking-widest block ml-1 text-left group-focus-within:text-gray-900 transition-colors font-bold">JUDUL DOKUMEN PENGAWASAN</label>
                   <input id="new-filename" type="text" placeholder="MASUKKAN JUDUL..." className="w-full p-5 border-[1.5px] border-[#FDF5E6]/60 rounded-3xl text-lg outline-none focus:border-gray-400 bg-[#FDF5E6]/60 backdrop-blur-sm text-gray-800 shadow-inner text-left transition-all focus:shadow-md hover:bg-[#FDF5E6]/80" />
                 </div>
                 <div className="grid grid-cols-2 gap-6 uppercase text-left leading-none">
                    <div className="space-y-3 text-left uppercase leading-none group">
                       <label className="text-[11px] text-gray-700 uppercase tracking-widest block ml-1 text-left group-focus-within:text-gray-900 transition-colors font-bold">NOMOR SURAT TUGAS</label>
                       <input id="st-number" type="text" placeholder="ST/XXX/..." className="w-full p-4 border-[1.5px] border-[#FDF5E6]/60 rounded-2xl text-sm outline-none focus:border-gray-400 bg-[#FDF5E6]/60 backdrop-blur-sm shadow-inner text-left text-gray-800 transition-all focus:shadow-md hover:bg-[#FDF5E6]/80" />
                    </div>
                    <div className="space-y-3 text-left uppercase leading-none group">
                       <label className="text-[11px] text-gray-700 uppercase tracking-widest block ml-1 text-left group-focus-within:text-gray-900 transition-colors font-bold">TAHUN ANGGARAN</label>
                       <select id="upload-year" className="w-full p-4 border-[1.5px] border-[#FDF5E6]/60 rounded-2xl text-sm outline-none focus:border-gray-400 bg-[#FDF5E6]/60 backdrop-blur-sm shadow-inner text-left text-gray-800 transition-all hover:bg-[#FDF5E6]/80 cursor-pointer">
                          {YEARS.filter(y => y !== "SEMUA TAHUN").map(y => <option key={y} value={y} className="text-left">{y}</option>)}
                       </select>
                    </div>
                 </div>
                 <input type="file" ref={uploadFileInputRef} className="hidden" onChange={handleFileSelect} />
                 <div onClick={handleUploadClick} className="h-52 border-4 border-dashed border-white/60 rounded-[3rem] flex flex-col items-center justify-center text-gray-500 bg-[#FDF5E6]/30 backdrop-blur-sm group hover:bg-[#FDF5E6]/60 hover:border-gray-400 transition-all duration-300 cursor-pointer shadow-inner relative text-center uppercase active:scale-[0.98]">
                   {selectedFileName ? (
                     <div className="flex flex-col items-center animate-in fade-in duration-300 px-8 text-center leading-none uppercase">
                       <div className="p-5 bg-[#FDF5E6]/90 rounded-3xl shadow-md mb-5 border-[1.5px] border-green-200 text-[#00a65a] text-center transform group-hover:scale-110 transition-transform duration-300"><FileIcon size={40} className="text-center"/></div>
                       <span className="text-[14px] uppercase text-gray-900 font-bold w-full truncate mb-2 text-center drop-shadow-sm">{selectedFileName}</span>
                       <span className="text-[11px] text-[#00a65a] uppercase bg-green-100/80 backdrop-blur-sm px-5 py-2 rounded-full border border-green-200/50 text-center font-bold">BERKAS TERPILIH</span>
                     </div>
                   ) : (
                     <>
                       <div className="p-5 bg-[#FDF5E6]/80 rounded-[2rem] shadow-sm group-hover:shadow-md group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 mb-5 border-[1.5px] border-[#FDF5E6]/50 group-hover:border-gray-400 text-gray-600 text-center"><Plus size={36} className="text-center"/></div>
                       <span className="text-[14px] uppercase tracking-[0.2em] text-gray-700 text-center transition-colors font-bold">KLIK UNTUK UNGGAH BERKAS</span>
                     </>
                   )}
                 </div>
                 <button onClick={handleProcessUpload} disabled={isUploading || !selectedFileName} style={globalGradientStyle} className="w-full py-6 text-white text-[15px] rounded-[1.5rem] shadow-md hover:shadow-xl uppercase tracking-[0.5em] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:translate-y-0 text-center">
                   {isUploading ? <RefreshCw size={20} className="animate-spin text-center"/> : <Upload size={20} className="text-center" />}
                   {isUploading ? "MEMPROSES..." : "UPLOAD"}
                 </button>
               </div>
            )}
         </div>
      </Modal>

      <Modal isOpen={modal.type === 'edit-profile'} onClose={() => setModal({ type: null, data: null })} title="EDIT INFORMASI PENGGUNA">
         <div className="space-y-8 text-left uppercase text-gray-800 leading-none">
            <div className="space-y-3 uppercase text-left leading-none group">
                <label className="text-[12px] text-gray-700 uppercase tracking-widest block ml-1 text-left group-focus-within:text-gray-900 transition-colors font-bold">NAMA LENGKAP & GELAR</label>
                <input type="text" className="w-full p-5 border-[1.5px] border-[#FDF5E6]/60 rounded-3xl text-lg outline-none focus:border-gray-400 bg-[#FDF5E6]/60 backdrop-blur-sm text-gray-800 shadow-inner text-left transition-all focus:shadow-md hover:bg-[#FDF5E6]/80" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div className="space-y-3 uppercase text-left leading-none group">
                <label className="text-[12px] text-gray-700 uppercase tracking-widest block ml-1 text-left group-focus-within:text-gray-900 transition-colors font-bold">JABATAN</label>
                <input type="text" className="w-full p-5 border-[1.5px] border-[#FDF5E6]/60 rounded-3xl text-lg outline-none focus:border-gray-400 bg-[#FDF5E6]/60 backdrop-blur-sm text-gray-800 shadow-inner text-left transition-all focus:shadow-md hover:bg-[#FDF5E6]/80" value={editForm.position} onChange={(e) => setEditForm({...editForm, position: e.target.value})} />
            </div>
            <div className="space-y-3 uppercase text-left leading-none group">
                <label className="text-[12px] text-gray-700 uppercase tracking-widest block ml-1 text-left group-focus-within:text-gray-900 transition-colors font-bold">GOLONGAN</label>
                <input type="text" className="w-full p-5 border-[1.5px] border-[#FDF5E6]/60 rounded-3xl text-lg outline-none focus:border-gray-400 bg-[#FDF5E6]/60 backdrop-blur-sm text-gray-800 shadow-inner text-left transition-all focus:shadow-md hover:bg-[#FDF5E6]/80" value={editForm.rank} onChange={(e) => setEditForm({...editForm, rank: e.target.value})} />
            </div>
            <button onClick={handleSaveProfile} style={globalGradientStyle} className="w-full py-6 text-white text-[15px] rounded-[1.5rem] shadow-md hover:shadow-xl uppercase tracking-[0.5em] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 text-center"><Save size={22} className="text-center"/> SIMPAN PERUBAHAN</button>
         </div>
      </Modal>

      <Modal isOpen={modal.type === 'photo-options'} onClose={() => setModal({ type: null, data: null })} title="KELOLA FOTO PROFIL">
         <div className="space-y-5 uppercase text-gray-800 text-left leading-none">
            <button onClick={() => setModal({ type: 'photo-view', data: null })} className="w-full py-6 bg-[#FDF5E6]/60 backdrop-blur-sm hover:bg-[#FDF5E6]/90 rounded-[2rem] flex items-center gap-6 px-10 transition-all duration-300 group border-[1.5px] border-[#FDF5E6]/50 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 text-left uppercase">
                <div className="p-4 bg-cyan-50/80 text-[#3c8dbc] rounded-2xl group-hover:scale-110 group-hover:bg-[#3c8dbc] group-hover:text-white transition-all duration-300 text-left shadow-sm"><Eye size={28} className="text-left"/></div>
                <div className="text-left leading-none text-gray-800"><p className="text-lg uppercase tracking-tighter text-left drop-shadow-sm">LIHAT FOTO</p><p className="text-[12px] text-gray-600 mt-2 uppercase text-left group-hover:text-gray-800 transition-colors font-bold">TAMPILAN PROFIL PENUH</p></div>
            </button>
            <button onClick={() => profileFileInputRef.current.click()} className="w-full py-6 bg-[#FDF5E6]/60 backdrop-blur-sm hover:bg-[#FDF5E6]/90 rounded-[2rem] flex items-center gap-6 px-10 transition-all duration-300 group border-[1.5px] border-[#FDF5E6]/50 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 text-left uppercase">
                <div className="p-4 bg-green-50/80 text-[#00a65a] rounded-2xl group-hover:scale-110 group-hover:bg-[#00a65a] group-hover:text-white transition-all duration-300 text-left shadow-sm"><Upload size={28} className="text-left" /></div>
                <div className="text-left leading-none text-gray-800"><p className="text-lg uppercase tracking-tighter text-left drop-shadow-sm">UPLOAD FOTO</p><p className="text-[12px] text-gray-600 mt-2 uppercase text-left group-hover:text-gray-800 transition-colors font-bold">SMARTPHONE / PC</p></div>
            </button>
            <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            {profileImage && <button onClick={() => {setProfileImage(null); setModal({ type: null, data: null });}} className="w-full py-5 text-red-600 hover:text-red-700 hover:bg-red-50/50 backdrop-blur-sm rounded-2xl text-[13px] uppercase tracking-[0.3em] transition-all active:scale-95 mt-4 text-center leading-none font-bold">HAPUS FOTO PROFIL</button>}
         </div>
      </Modal>

      <Modal isOpen={modal.type === 'detail'} onClose={() => setModal({ type: null, data: null })} title="METADATA DOKUMEN">
        <div className="space-y-10 py-4 uppercase text-gray-800 text-left leading-none">
            <div className="p-10 bg-white/40 backdrop-blur-sm rounded-[3rem] border-[3px] border-dashed border-[#FDF5E6]/60 flex items-center gap-10 shadow-sm hover:shadow-md transition-shadow text-left">
                <div className="p-6 bg-[#FDF5E6]/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-[#FDF5E6]/50 text-gray-600 text-left hover:scale-105 transition-transform"><FileIcon size={56} className="text-left"/></div>
                <div className="overflow-hidden uppercase leading-none text-left text-gray-800">
                    <p className="text-3xl text-gray-900 leading-tight mb-4 tracking-tighter uppercase truncate text-left drop-shadow-sm">{modal.data?.name}</p>
                    <span className="text-white px-5 py-2.5 rounded-2xl text-[13px] uppercase tracking-widest shadow-sm text-left" style={globalGradientStyle}>{modal.data?.category}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 shadow-none uppercase text-left text-gray-800 leading-none">
                <div className="bg-[#FDF5E6]/50 backdrop-blur-sm p-8 rounded-[2.5rem] border-[1.5px] border-[#FDF5E6]/60 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-1 leading-none">
                    <p className="text-[13px] text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-3 text-left font-bold"><User size={16} className="text-left text-gray-500"/> PETUGAS</p>
                    <p className="text-[16px] text-gray-900 uppercase tracking-tighter truncate text-left drop-shadow-sm">{currentUser?.name}</p>
                </div>
                <div className="bg-[#FDF5E6]/50 backdrop-blur-sm p-8 rounded-[2.5rem] border-[1.5px] border-[#FDF5E6]/60 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-1 leading-none">
                    <p className="text-[13px] text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-3 text-left font-bold"><ShieldCheck size={16} className="text-left text-[#00a65a]"/> INTEGRITAS</p>
                    <p className="text-[16px] text-[#00a65a] uppercase leading-none text-left drop-shadow-sm font-black">DIGITAL SIGNED</p>
                </div>
            </div>
            <button onClick={() => setModal({ type: null, data: null })} style={globalGradientStyle} className="w-full py-6 text-white text-[15px] rounded-[1.5rem] uppercase tracking-[0.4em] mt-10 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 text-center">TUTUP INFORMASI</button>
        </div>
      </Modal>

      <Modal isOpen={modal.type === 'photo-view'} onClose={() => setModal({ type: null, data: null })} title="FOTO PROFIL">
        <div className="flex flex-col items-center py-10 uppercase text-center leading-none">
            <div className="w-72 h-96 bg-[#FDF5E6]/50 backdrop-blur-sm rounded-[3rem] overflow-hidden shadow-md relative text-center group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                {profileImage ? <img src={profileImage} className="w-full h-full object-cover text-center transition-transform duration-500 group-hover:scale-110" alt="Large" /> : <User size={120} className="w-full h-full p-16 text-gray-400 text-center transition-transform duration-500 group-hover:scale-110" />}
            </div>
            <button onClick={() => setModal({ type: null, data: null })} style={globalGradientStyle} className="mt-12 px-12 py-5 text-white text-[13px] uppercase tracking-widest rounded-2xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 text-center">KEMBALI</button>
        </div>
      </Modal>
    </div>
  );
}
