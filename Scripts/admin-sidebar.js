// ============================================
// ADMIN SIDEBAR — Replace horizontal tabs with
// a beautiful categorized sidebar navigation
// ============================================
(function () {
    'use strict';

    // Category definitions: each tab is placed into a group
    const CATEGORIES = [
        {
            label: 'الرئيسية والواجهة',
            icon: '🏠',
            items: [
                { tab: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
                { tab: 'homepage', label: 'واجهة المتجر الرئيسية', icon: '🎨' }
            ]
        },
        {
            label: 'المتجر',
            icon: '🛒',
            items: [
                { tab: 'orders', label: 'الطلبات', icon: '📋' },
                { tab: 'products', label: 'المنتجات', icon: '📦' },
                { tab: 'coupons', label: 'الكوبونات', icon: '🎫' },
                { tab: 'reviews', label: 'التقييمات', icon: '⭐' }
            ]
        },
        {
            label: 'المحتوى والوسائط',
            icon: '📄',
            items: [
                { tab: 'images', label: 'معرض الصور', icon: '🖼️' }
            ]
        },
        {
            label: 'الأدوات',
            icon: '🔧',
            items: [
                { tab: 'support', label: 'الدعم الفني', icon: '🎧' },
                { tab: 'activity', label: 'سجل النشاط', icon: '📜' },
                { tab: 'seo', label: 'SEO', icon: '🌐' }
            ]
        },
        {
            label: 'النظام',
            icon: '⚙️',
            items: [
                { tab: 'settings', label: 'إعدادات المتجر العامة', icon: '⚙️' }
            ]
        }
    ];

    function injectStyles() {
        if (document.getElementById('admin-sidebar-styles')) return;
        const style = document.createElement('style');
        style.id = 'admin-sidebar-styles';
        style.textContent = `
            /* ---- Hide old horizontal tabs ---- */
            .admin-tabs {
                display: none !important;
            }

            /* ---- Dashboard becomes sidebar layout ---- */
            .admin-layout-wrapper {
                display: flex;
                flex: 1;
                min-height: 0;
            }

            /* ---- Sidebar ---- */
            .admin-sidebar {
                width: 250px;
                min-width: 250px;
                background: rgba(30, 41, 59, 0.95);
                border-left: 1px solid rgba(56, 189, 248, 0.2);
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 1rem 0;
                position: fixed;
                top: 58px;
                right: 0;
                height: calc(100vh - 58px);
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.1) transparent;
                z-index: 99;
                transition: width 0.3s cubic-bezier(0.4,0,0.2,1),
                            min-width 0.3s cubic-bezier(0.4,0,0.2,1),
                            transform 0.3s cubic-bezier(0.4,0,0.2,1);
            }
            .admin-sidebar::-webkit-scrollbar { width: 4px; }
            .admin-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

            /* Push main content away from sidebar */
            .admin-main {
                margin-right: 250px;
            }
            .admin-sidebar.collapsed ~ .admin-main {
                margin-right: 62px;
            }

            /* ---- Collapsed state ---- */
            .admin-sidebar.collapsed {
                width: 62px;
                min-width: 62px;
            }
            .admin-sidebar.collapsed .sidebar-logo-text,
            .admin-sidebar.collapsed .sidebar-category-label span:not(.cat-icon),
            .admin-sidebar.collapsed .nav-label,
            .admin-sidebar.collapsed .sidebar-nav-badge {
                opacity: 0;
                width: 0;
                overflow: hidden;
                white-space: nowrap;
                transition: opacity 0.2s, width 0.2s;
            }
            .admin-sidebar.collapsed .sidebar-category-label {
                justify-content: center;
                padding: 0.5rem 0 0.3rem;
            }
            .admin-sidebar.collapsed .sidebar-logo {
                justify-content: center;
                padding: 0.5rem 0 1rem;
            }
            .admin-sidebar.collapsed .sidebar-nav-item {
                justify-content: center;
                padding: 10px 0;
                margin: 1px 6px;
                width: calc(100% - 12px);
            }
            .admin-sidebar.collapsed .sidebar-nav-item .nav-icon {
                min-width: auto;
            }
            .admin-sidebar.collapsed .sidebar-nav-item.active::before {
                right: -6px;
            }

            /* Tooltip on hover when collapsed */
            .admin-sidebar.collapsed .sidebar-nav-item {
                position: relative;
            }
            .admin-sidebar.collapsed .sidebar-nav-item:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                left: calc(100% + 12px);
                top: 50%;
                transform: translateY(-50%);
                background: rgba(15, 23, 42, 0.95);
                border: 1px solid rgba(56, 189, 248, 0.25);
                color: white;
                padding: 5px 12px;
                border-radius: 8px;
                font-size: 0.8rem;
                white-space: nowrap;
                z-index: 200;
                pointer-events: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            /* Collapse toggle button */
            .sidebar-collapse-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04);
                color: rgba(255,255,255,0.4);
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
                margin-right: auto;
                flex-shrink: 0;
            }
            .sidebar-collapse-btn:hover {
                background: rgba(255,255,255,0.1);
                color: white;
            }
            .admin-sidebar.collapsed .sidebar-collapse-btn {
                margin: 0 auto;
            }

            /* Sidebar logo area */
            .sidebar-logo {
                padding: 0.5rem 1.2rem 1.2rem;
                border-bottom: 1px solid rgba(255,255,255,0.06);
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .sidebar-logo img {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                flex-shrink: 0;
            }
            .sidebar-logo-text {
                font-size: 0.95rem;
                font-weight: 700;
                background: linear-gradient(135deg, #0ea5e9, #38bdf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                transition: opacity 0.2s, width 0.2s;
                white-space: nowrap;
            }

            /* Category group */
            .sidebar-category {
                margin-bottom: 0.25rem;
            }
            .sidebar-category-label {
                padding: 0.5rem 1.2rem 0.3rem;
                font-size: 0.65rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: rgba(255,255,255,0.35);
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .sidebar-category-label span.cat-icon {
                font-size: 0.7rem;
            }

            /* Nav items */
            .sidebar-nav-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 1.2rem 10px 1rem;
                margin: 1px 8px;
                border-radius: 10px;
                color: rgba(255,255,255,0.7);
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid transparent;
                font-size: 0.88rem;
                font-weight: 500;
                position: relative;
                font-family: 'Cairo', sans-serif;
                background: none;
                width: calc(100% - 16px);
                text-align: right;
            }
            .sidebar-nav-item:hover {
                background: rgba(255,255,255,0.08);
                color: #ffffff;
            }
            .sidebar-nav-item.active {
                background: linear-gradient(135deg, rgba(2,132,199,0.25), rgba(14,165,233,0.15));
                color: #38bdf8;
                border-color: rgba(56,189,248,0.35);
                font-weight: 600;
            }
            .sidebar-nav-item.active::before {
                content: '';
                position: absolute;
                right: -8px;
                top: 50%;
                transform: translateY(-50%);
                width: 3px;
                height: 60%;
                background: linear-gradient(180deg, #0284c7, #38bdf8);
                border-radius: 3px;
            }
            .sidebar-nav-item .nav-icon {
                font-size: 1.05rem;
                min-width: 24px;
                text-align: center;
            }
            .sidebar-nav-item .nav-label {
                flex: 1;
            }

            /* Badge for unread counts etc */
            .sidebar-nav-badge {
                background: linear-gradient(135deg, #f093fb, #f5576c);
                color: white;
                font-size: 0.6rem;
                font-weight: 700;
                padding: 1px 7px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
            }

            /* Content area adjustment */
            .admin-main {
                flex: 1;
                min-width: 0;
                padding: 1.5rem 2rem;
                overflow-y: auto;
            }

            /* ---- Mobile Hamburger ---- */
            .sidebar-toggle-btn {
                display: none;
                position: fixed;
                bottom: 1.5rem;
                right: 1.5rem;
                width: 50px;
                height: 50px;
                border-radius: 14px;
                background: linear-gradient(135deg, #0284c7, #0ea5e9);
                color: white;
                border: 1px solid rgba(56, 189, 248, 0.4);
                font-size: 1.4rem;
                cursor: pointer;
                z-index: 1001;
                box-shadow: 0 4px 20px rgba(14, 165, 233, 0.45);
                transition: all 0.3s;
                align-items: center;
                justify-content: center;
            }
            .sidebar-toggle-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 8px 25px rgba(56, 189, 248, 0.6);
            }

            /* Sidebar overlay for mobile */
            .sidebar-overlay {
                display: none;
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
                z-index: 99;
            }

            /* ---- Mobile Responsive ---- */
            @media (max-width: 900px) {
                .admin-sidebar {
                    position: fixed;
                    right: 0;
                    top: 0;
                    height: 100vh;
                    transform: translateX(100%);
                    box-shadow: -8px 0 30px rgba(0,0,0,0.4);
                    z-index: 1000; /* Above header (999) */
                }
                .admin-sidebar.open {
                    transform: translateX(0);
                }
                .sidebar-toggle-btn {
                    display: flex;
                }
                .sidebar-overlay.open {
                    display: block;
                }
                .admin-main {
                    padding: 1rem;
                    margin-right: 0 !important;
                }
            }
            /* ---- Header Enhancement ---- */
            .admin-header {
                background: rgba(15, 23, 42, 0.95) !important;
                backdrop-filter: blur(14px);
                border-bottom: 1px solid rgba(56, 189, 248, 0.25) !important;
                padding: 1rem 2rem;
                position: sticky;
                top: 0;
                z-index: 999;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
            }
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: none;
                margin: 0;
            }
            .header-title-area {
                display: flex;
                flex-direction: column;
            }
            .header-breadcrumbs {
                font-size: 0.75rem;
                color: rgba(226, 232, 240, 0.6);
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;
            }
            .header-breadcrumbs span.separator {
                opacity: 0.4;
            }
            .header-page-title {
                font-size: 1.25rem;
                font-weight: 700;
                color: white;
                margin: 0;
                background: linear-gradient(135deg, #ffffff 0%, #7dd3fc 50%, #38bdf8 100%);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .header-actions {
                gap: 12px;
            }
            .btn-header-action {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(56, 189, 248, 0.2);
                color: white;
                padding: 8px 16px;
                border-radius: 10px;
                font-size: 0.85rem;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
                text-decoration: none;
                cursor: pointer;
            }
            .btn-header-action:hover {
                background: rgba(14, 165, 233, 0.15);
                border-color: rgba(56, 189, 248, 0.4);
                transform: translateY(-1px);
            }
            
            /* View Store Group */
            .view-store-group {
                position: relative;
                display: flex;
                align-items: center;
            }
            .view-store-trigger {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border-radius: 12px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(56, 189, 248, 0.2);
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                color: rgba(255,255,255,0.85);
                text-decoration: none;
                font-size: 0.82rem;
                font-weight: 500;
                white-space: nowrap;
                line-height: 1;
            }
            .view-store-trigger:hover {
                background: rgba(14, 165, 233, 0.15);
                border-color: rgba(56, 189, 248, 0.4);
                color: white;
            }
            .view-store-trigger.open {
                background: rgba(14, 165, 233, 0.2);
                border-color: rgba(56, 189, 248, 0.5);
            }
            .view-store-icon {
                font-size: 1rem;
                line-height: 1;
            }
            .view-store-label {
                display: flex;
                flex-direction: column;
                gap: 1px;
            }
            .view-store-title {
                font-size: 0.78rem;
                font-weight: 600;
                color: white;
            }
            .view-store-target {
                font-size: 0.65rem;
                color: rgba(255,255,255,0.5);
                font-weight: 500;
            }
            .view-store-chevron {
                font-size: 0.55rem;
                color: rgba(255,255,255,0.35);
                transition: transform 0.25s ease;
                margin-right: 2px;
            }
            .view-store-trigger.open .view-store-chevron {
                transform: rotate(180deg);
            }

            /* View Store Dropdown */
            .view-store-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                left: auto;
                min-width: 200px;
                background: rgba(15, 23, 42, 0.98);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(56, 189, 248, 0.25);
                border-radius: 14px;
                padding: 6px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-8px) scale(0.97);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 2000;
                box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
            }
            .view-store-dropdown.open {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }
            .view-store-option {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 14px;
                border-radius: 10px;
                color: rgba(255,255,255,0.75);
                font-size: 0.82rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease;
                border: none;
                background: none;
                width: 100%;
                text-align: right;
                font-family: inherit;
            }
            .view-store-option:hover {
                background: rgba(255,255,255,0.07);
                color: white;
            }
            .view-store-option.active {
                background: rgba(14, 165, 233, 0.18);
                color: #38bdf8;
            }
            .view-store-option .opt-icon {
                font-size: 1rem;
                min-width: 22px;
                text-align: center;
            }
            .view-store-option .opt-check {
                margin-right: auto;
                font-size: 0.75rem;
                color: #38bdf8;
                opacity: 0;
                transition: opacity 0.15s;
            }
            .view-store-option.active .opt-check {
                opacity: 1;
            }

            /* ---- Admin User Dropdown ---- */
            .admin-user-menu {
                position: relative;
            }
            .admin-user-trigger {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 5px 12px 5px 8px;
                border-radius: 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(56, 189, 248, 0.2);
                cursor: pointer;
                transition: all 0.25s ease;
                color: white;
            }
            .admin-user-trigger:hover {
                background: rgba(14, 165, 233, 0.12);
                border-color: rgba(56, 189, 248, 0.4);
                transform: translateY(-1px);
            }
            .admin-user-trigger.open {
                background: rgba(14, 165, 233, 0.2);
                border-color: rgba(56, 189, 248, 0.5);
            }
            .admin-user-avatar {
                width: 34px;
                height: 34px;
                border-radius: 10px;
                background: linear-gradient(135deg, #0284c7, #0ea5e9);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.95rem;
                font-weight: 700;
                color: white;
                flex-shrink: 0;
                letter-spacing: -0.5px;
                box-shadow: 0 2px 10px rgba(14, 165, 233, 0.4);
            }
            .admin-user-info {
                display: flex;
                flex-direction: column;
                text-align: right;
                line-height: 1.2;
            }
            .admin-user-name {
                font-size: 0.82rem;
                font-weight: 600;
                color: white;
                white-space: nowrap;
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .admin-user-role {
                font-size: 0.65rem;
                color: rgba(255,255,255,0.45);
                font-weight: 500;
            }
            .admin-user-chevron {
                font-size: 0.6rem;
                color: rgba(255,255,255,0.4);
                transition: transform 0.25s ease;
                margin-right: 2px;
            }
            .admin-user-trigger.open .admin-user-chevron {
                transform: rotate(180deg);
            }

            /* Dropdown Panel */
            .admin-user-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: auto;
                left: 0;
                min-width: 220px;
                background: rgba(15, 23, 42, 0.98);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(56, 189, 248, 0.25);
                border-radius: 14px;
                padding: 8px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-8px) scale(0.97);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 2000;
                box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
            }
            .admin-user-dropdown.open {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }
            .admin-dropdown-header {
                padding: 12px 14px;
                border-bottom: 1px solid rgba(255,255,255,0.07);
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .admin-dropdown-header .admin-user-avatar {
                width: 40px;
                height: 40px;
                font-size: 1.05rem;
            }
            .admin-dropdown-header-info {
                display: flex;
                flex-direction: column;
            }
            .admin-dropdown-header-name {
                font-size: 0.88rem;
                font-weight: 600;
                color: white;
            }
            .admin-dropdown-header-email {
                font-size: 0.7rem;
                color: rgba(255,255,255,0.4);
                max-width: 170px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .admin-dropdown-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 14px;
                border-radius: 10px;
                color: rgba(255,255,255,0.75);
                font-size: 0.84rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease;
                border: none;
                background: none;
                width: 100%;
                text-align: right;
                text-decoration: none;
                font-family: inherit;
            }
            .admin-dropdown-item:hover {
                background: rgba(255,255,255,0.07);
                color: white;
            }
            .admin-dropdown-item .dropdown-icon {
                font-size: 1rem;
                min-width: 22px;
                text-align: center;
            }
            .admin-dropdown-divider {
                height: 1px;
                background: rgba(255,255,255,0.07);
                margin: 6px 8px;
            }
            .admin-dropdown-item.logout-item {
                color: #ff6b6b;
            }
            .admin-dropdown-item.logout-item:hover {
                background: rgba(255,59,48,0.12);
                color: #ff4444;
            }

            /* ---- Global overflow guard ---- */
            html, body {
                overflow-x: hidden !important;
                max-width: 100vw !important;
            }
            .dashboard-container {
                overflow-x: hidden;
                max-width: 100vw;
            }
            .admin-layout-wrapper {
                overflow-x: hidden;
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                .admin-header {
                    padding: 0.6rem 0.75rem !important;
                }

                .header-content {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 0;
                    align-items: center;
                    justify-content: space-between;
                    max-width: 100%;
                }
                
                .header-title-area {
                    flex: 1;
                    min-width: 0;
                    text-align: right;
                }

                .header-breadcrumbs {
                    font-size: 0.65rem;
                    margin-bottom: 2px;
                }
                
                .header-page-title {
                    font-size: 1rem !important;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .header-actions {
                    flex-shrink: 0;
                    gap: 6px;
                    flex-wrap: nowrap;
                }
                
                .btn-text {
                    display: none;
                }
                
                /* View Store — icon only on mobile */
                .view-store-label {
                    display: none;
                }
                .view-store-chevron {
                    display: none;
                }
                .view-store-trigger {
                    padding: 6px 8px;
                    border-radius: 10px;
                }
                .view-store-dropdown {
                    position: fixed;
                    top: 60px;
                    right: 0.5rem;
                    left: 0.5rem;
                    max-width: calc(100vw - 1rem);
                    min-width: unset;
                    width: calc(100vw - 1rem);
                }

                /* Admin user — avatar only on mobile */
                .admin-user-info {
                    display: none;
                }
                .admin-user-chevron {
                    display: none;
                }
                .admin-user-trigger {
                    padding: 4px;
                    border-radius: 10px;
                }
                .admin-user-dropdown {
                    position: fixed;
                    top: auto;
                    bottom: auto;
                    right: 0.5rem;
                    left: 0.5rem;
                    max-width: calc(100vw - 1rem);
                    min-width: unset;
                    width: calc(100vw - 1rem);
                    top: 60px;
                }

                /* Currency switcher */
                .currency-btn-group {
                    transform: scale(0.9);
                    transform-origin: center center;
                }

                /* Layout wrapper */
                .admin-layout-wrapper {
                    overflow: hidden;
                    max-width: 100vw;
                }

                .admin-main {
                    padding: 0.75rem !important;
                    max-width: 100vw;
                    overflow-x: hidden;
                }
            }

            /* Extra small screens */
            @media (max-width: 400px) {
                .header-page-title {
                    font-size: 0.9rem !important;
                }
                .header-breadcrumbs {
                    display: none;
                }
                .view-store-trigger {
                    padding: 5px 7px;
                }
                .admin-user-avatar {
                    width: 30px;
                    height: 30px;
                    font-size: 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function enhanceHeader() {
        const header = document.querySelector('.admin-header');
        if (!header) return;

        // Replace content with new structure
        header.innerHTML = `
            <div class="header-content">
                <div class="header-title-area">
                    <div class="header-breadcrumbs">
                        <span>الرئيسية</span>
                        <span class="separator">/</span>
                        <span id="header-active-tab">لوحة التحكم</span>
                    </div>
                    <h1 class="header-page-title" id="header-page-title">نظرة عامة</h1>
                </div>
                <div class="header-actions">
                    <div class="view-store-group" id="view-store-group">
                        <div class="view-store-trigger" id="view-store-trigger">
                            <span class="view-store-icon">🌐</span>
                            <div class="view-store-label">
                                <span class="view-store-title">عرض المتجر</span>
                                <span class="view-store-target" id="view-store-target-label">المحلي</span>
                            </div>
                            <span class="view-store-chevron">▼</span>
                        </div>
                        <div class="view-store-dropdown" id="view-store-dropdown">
                            <button class="view-store-option active" data-store-target="local">
                                <span class="opt-icon">💻</span>
                                <span>المحلي (Index)</span>
                                <span class="opt-check">✓</span>
                            </button>
                            <button class="view-store-option" data-store-target="live">
                                <span class="opt-icon">🌍</span>
                                <span>المباشر (ZeroNux.store)</span>
                                <span class="opt-check">✓</span>
                            </button>
                        </div>
                    </div>
                    
                    <button id="admin-search-trigger" class="admin-header-icon-btn" title="بحث شامل (Ctrl+K)" onclick="if (window.openAdminSearch) window.openAdminSearch();">🔍</button>
                    
                    <div class="admin-user-menu" id="admin-user-menu">
                        <div class="admin-user-trigger" id="admin-user-trigger">
                            <div class="admin-user-avatar" id="admin-user-avatar">A</div>
                            <div class="admin-user-info">
                                <span class="admin-user-name" id="admin-user-name">المدير</span>
                                <span class="admin-user-role">مدير النظام</span>
                            </div>
                            <span class="admin-user-chevron">▼</span>
                        </div>
                        <div class="admin-user-dropdown" id="admin-user-dropdown">
                            <div class="admin-dropdown-header">
                                <div class="admin-user-avatar" id="admin-dropdown-avatar">A</div>
                                <div class="admin-dropdown-header-info">
                                    <span class="admin-dropdown-header-name" id="admin-dropdown-name">المدير</span>
                                    <span class="admin-dropdown-header-email" id="admin-dropdown-email">admin@zeronux.store</span>
                                </div>
                            </div>
                            <a href="profile.html" class="admin-dropdown-item">
                                <span class="dropdown-icon">👤</span>
                                <span>الملف الشخصي</span>
                            </a>
                            <button class="admin-dropdown-item" onclick="if(typeof switchTab==='function'){switchTab('settings');document.getElementById('admin-user-dropdown').classList.remove('open');document.getElementById('admin-user-trigger').classList.remove('open');}">
                                <span class="dropdown-icon">⚙️</span>
                                <span>الإعدادات</span>
                            </button>
                            <a href="index.html" class="admin-dropdown-item" target="_blank">
                                <span class="dropdown-icon">🏪</span>
                                <span>عرض المتجر</span>
                            </a>
                            <div class="admin-dropdown-divider"></div>
                            <button class="admin-dropdown-item logout-item" id="logout-btn-enhanced">
                                <span class="dropdown-icon">🚪</span>
                                <span>تسجيل الخروج</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // ---- View Store Custom Dropdown Logic ----
        const storeTrigger = document.getElementById('view-store-trigger');
        const storeDropdown = document.getElementById('view-store-dropdown');
        const storeTargetLabel = document.getElementById('view-store-target-label');

        if (storeTrigger && storeDropdown) {
            // Load saved preference
            const savedTarget = localStorage.getItem('admin_view_store_target') || 'local';
            setActiveStoreTarget(savedTarget);

            // Toggle dropdown
            storeTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = storeDropdown.classList.toggle('open');
                storeTrigger.classList.toggle('open', isOpen);
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#view-store-group')) {
                    storeDropdown.classList.remove('open');
                    storeTrigger.classList.remove('open');
                }
            });

            // Option clicks
            storeDropdown.querySelectorAll('.view-store-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const target = opt.dataset.storeTarget;
                    setActiveStoreTarget(target);
                    localStorage.setItem('admin_view_store_target', target);
                    storeDropdown.classList.remove('open');
                    storeTrigger.classList.remove('open');
                    // Open in new tab
                    const url = target === 'live' ? 'https://zeronux.store' : 'index.html';
                    window.open(url, '_blank');
                });
            });

            function setActiveStoreTarget(target) {
                storeDropdown.querySelectorAll('.view-store-option').forEach(o => {
                    o.classList.toggle('active', o.dataset.storeTarget === target);
                });
                if (storeTargetLabel) {
                    storeTargetLabel.textContent = target === 'live' ? 'المباشر' : 'المحلي';
                }
            }
        }

        // ---- User Dropdown Logic ----
        const userTrigger = document.getElementById('admin-user-trigger');
        const userDropdown = document.getElementById('admin-user-dropdown');

        if (userTrigger && userDropdown) {
            userTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = userDropdown.classList.toggle('open');
                userTrigger.classList.toggle('open', isOpen);
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#admin-user-menu')) {
                    userDropdown.classList.remove('open');
                    userTrigger.classList.remove('open');
                }
            });
        }

        // Populate user info from Firebase Auth
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                populateUserMenu(currentUser);
            }
            // Also listen for auth state in case it loads later
            firebase.auth().onAuthStateChanged((user) => {
                if (user) populateUserMenu(user);
            });
        }

        function populateUserMenu(user) {
            const displayName = user.displayName || user.email?.split('@')[0] || 'المدير';
            const email = user.email || '';
            const initials = getInitials(displayName);

            // Update trigger
            const avatarEl = document.getElementById('admin-user-avatar');
            const nameEl = document.getElementById('admin-user-name');
            if (avatarEl) avatarEl.textContent = initials;
            if (nameEl) nameEl.textContent = displayName;

            // Update dropdown header
            const dropdownAvatar = document.getElementById('admin-dropdown-avatar');
            const dropdownName = document.getElementById('admin-dropdown-name');
            const dropdownEmail = document.getElementById('admin-dropdown-email');
            if (dropdownAvatar) dropdownAvatar.textContent = initials;
            if (dropdownName) dropdownName.textContent = displayName;
            if (dropdownEmail) dropdownEmail.textContent = email;
        }

        function getInitials(name) {
            if (!name) return 'A';
            const parts = name.trim().split(/\s+/);
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return parts[0].substring(0, 2).toUpperCase();
        }

        // Re-attach logout listener
        const logoutBtn = document.getElementById('logout-btn-enhanced');
        if (logoutBtn && window.logout) {
            logoutBtn.addEventListener('click', window.logout);
        } else if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                firebase.auth().signOut().then(() => {
                    window.location.reload();
                });
            });
        }

        // Dispatch event for currency switcher
        document.dispatchEvent(new CustomEvent('admin-header-ready'));
    }

    function updateHeaderTitle(tabName) {
        const activeItem = document.querySelector(`.sidebar-nav-item[data-sidebar-tab="${tabName}"]`);
        if (activeItem) {
            const label = activeItem.querySelector('.nav-label').textContent;

            // Find parent category label
            let categoryLabel = 'الرئيسية';
            const categoryEl = activeItem.closest('.sidebar-category');
            if (categoryEl) {
                const labelEl = categoryEl.querySelector('.sidebar-category-label');
                if (labelEl) {
                    // Clone to get text without icon
                    const clone = labelEl.cloneNode(true);
                    const icon = clone.querySelector('.cat-icon');
                    if (icon) icon.remove();
                    categoryLabel = clone.textContent.trim();
                }
            }

            // Update Breadcrumb Root (Category)
            const breadcrumbRoot = document.querySelector('.header-breadcrumbs span:first-child');
            if (breadcrumbRoot) breadcrumbRoot.textContent = categoryLabel;

            // Update Breadcrumb Leaf (Tab) & Page Title
            const breadcrumb = document.getElementById('header-active-tab');
            const title = document.getElementById('header-page-title');

            if (breadcrumb) breadcrumb.textContent = label;
            if (title) title.textContent = label;
        }
    }

    function buildSidebar() {
        enhanceHeader();
        const adminMain = document.querySelector('.admin-main');
        if (!adminMain) return;

        // Create sidebar element
        const sidebar = document.createElement('nav');
        sidebar.className = 'admin-sidebar';
        sidebar.id = 'admin-sidebar';

        // Check saved collapsed state
        const isCollapsed = localStorage.getItem('admin_sidebar_collapsed') === 'true';
        if (isCollapsed) sidebar.classList.add('collapsed');

        // Logo area + collapse button
        sidebar.innerHTML = `
            <div class="sidebar-logo">
                <img src="Images/Logo-noBG.png" alt="New Desgin" onerror="this.style.display='none'" style="object-fit: contain;">
                <span class="sidebar-logo-text">New Desgin Admin</span>
                <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="طي/فتح القائمة">${isCollapsed ? '→' : '←'}</button>
            </div>
        `;

        // Build category groups
        CATEGORIES.forEach(cat => {
            const group = document.createElement('div');
            group.className = 'sidebar-category';
            group.innerHTML = `
                <div class="sidebar-category-label">
                    <span class="cat-icon">${cat.icon}</span>
                    ${cat.label}
                </div>
            `;

            cat.items.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'sidebar-nav-item';
                btn.setAttribute('data-sidebar-tab', item.tab);
                btn.setAttribute('data-tooltip', item.label);
                btn.innerHTML = `
                    <span class="nav-icon">${item.icon}</span>
                    <span class="nav-label">${item.label}</span>
                `;

                // Default active
                if (item.tab === 'dashboard') {
                    btn.classList.add('active');
                }

                btn.addEventListener('click', () => {
                    // Use existing switchTab
                    if (typeof switchTab === 'function') {
                        switchTab(item.tab);
                    }
                    // Update sidebar active state
                    sidebar.querySelectorAll('.sidebar-nav-item').forEach(n => n.classList.remove('active'));
                    btn.classList.add('active');

                    // Close mobile sidebar
                    closeMobileSidebar();
                });

                group.appendChild(btn);
            });

            sidebar.appendChild(group);
        });

        // Create layout wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'admin-layout-wrapper';

        // Move admin-main into wrapper
        adminMain.parentNode.insertBefore(wrapper, adminMain);
        wrapper.appendChild(sidebar);
        wrapper.appendChild(adminMain);

        // Mobile toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.id = 'sidebar-toggle';
        toggleBtn.innerHTML = '☰';
        document.body.appendChild(toggleBtn);

        // Mobile overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebar-overlay';
        document.body.appendChild(overlay);

        // Toggle events
        toggleBtn.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('open');
            if (isOpen) {
                closeMobileSidebar();
            } else {
                sidebar.classList.add('open');
                overlay.classList.add('open');
                toggleBtn.innerHTML = '✕';
            }
        });

        overlay.addEventListener('click', closeMobileSidebar);

        function closeMobileSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            toggleBtn.innerHTML = '☰';
        }

        // Collapse toggle
        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const collapsed = sidebar.classList.toggle('collapsed');
                localStorage.setItem('admin_sidebar_collapsed', collapsed);
                collapseBtn.textContent = collapsed ? '→' : '←';
            });
        }

        // Watch for dynamically injected tabs and sync sidebar active state
        watchDynamicTabs(sidebar);
    }

    // Watch for dynamic tab injections (from admin-seo.js, admin-support.js, etc.)
    // These scripts add buttons to .admin-tabs. The sidebar already has entries for them,
    // so we just need to make sure clicking them works — which it does via switchTab().
    // But we also need to handle when switchTab is called externally.
    function watchDynamicTabs(sidebar) {
        // Monkey-patch switchTab to keep sidebar in sync
        const originalSwitchTab = window.switchTab;
        if (originalSwitchTab) {
            window.switchTab = function (tabName) {
                originalSwitchTab(tabName);
                // Save state
                localStorage.setItem('admin_active_tab', tabName);
                // Sync sidebar
                sidebar.querySelectorAll('.sidebar-nav-item').forEach(n => {
                    n.classList.toggle('active', n.getAttribute('data-sidebar-tab') === tabName);
                });
                // Update header
                updateHeaderTitle(tabName);
            };
        }
    }

    function init() {
        injectStyles();

        // Wait for admin dashboard to be visible
        const check = setInterval(() => {
            const dashboard = document.getElementById('admin-dashboard');
            const adminMain = document.querySelector('.admin-main');
            if (dashboard && adminMain && dashboard.style.display !== 'none') {
                clearInterval(check);
                // Small delay to let other scripts inject their tabs first
                setTimeout(() => {
                    buildSidebar();
                    // Restore active tab
                    const savedTab = localStorage.getItem('admin_active_tab');
                    if (savedTab && savedTab !== 'dashboard') {
                        if (typeof window.switchTab === 'function') {
                            window.switchTab(savedTab);
                        }
                    }
                }, 400);
            }
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
