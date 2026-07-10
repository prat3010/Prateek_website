import streamlit as st
from datetime import datetime, timedelta
from sync_tabs.shared import HAS_SYNC, call_rpc, fetch_page_visits

def render_analytics_tab():
    st.markdown('<div class="section-header">Live Telemetry & Analytics Dashboard</div>', unsafe_allow_html=True)
    st.write("Real-time telemetry aggregated directly from Supabase DB `page_visits` logs.")

    if not HAS_SYNC:
        st.warning("⚠️ Supabase sync configuration not found or database offline. Telemetry is unavailable.")
    else:
        # Timeframe selector
        timeframe_opts = {
            "Last 24 Hours": timedelta(days=1),
            "Last 7 Days": timedelta(days=7),
            "Last 30 Days": timedelta(days=30),
            "Last 90 Days": timedelta(days=90),
        }
        selected_timeframe = st.selectbox("Select Timeframe Filter:", list(timeframe_opts.keys()), index=1)
        
        # Calculate cutoff time in ISO format
        cutoff_dt = datetime.now() - timeframe_opts[selected_timeframe]
        cutoff_iso = cutoff_dt.isoformat() + "Z"
        
        # Fetch summary data via RPC
        with st.spinner("Fetching analytics summary..."):
            summary_res = call_rpc("get_analytics_summary", {"cutoff_time": cutoff_iso})
            
        if not summary_res:
            st.error("Could not load analytics summary. Please check database permissions or stored procedures.")
        else:
            # Structuring summary details
            total_views = summary_res.get("total_views", 0)
            total_bots = summary_res.get("total_bots", 0)
            unique_visitors = summary_res.get("unique_visitors", 0)
            desktop_count = summary_res.get("desktop_count", 0)
            mobile_count = summary_res.get("mobile_count", 0)
            tablet_count = summary_res.get("tablet_count", 0)
            
            # Key stats layout
            c1, c2, c3, c4 = st.columns(4)
            with c1:
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{total_views}</div>
                    <div class="telemetry-card-lbl">Page Views</div>
                </div>
                """, unsafe_allow_html=True)
            with c2:
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{unique_visitors}</div>
                    <div class="telemetry-card-lbl">Unique Visitors</div>
                </div>
                """, unsafe_allow_html=True)
            with c3:
                bot_percent = round((total_bots / (total_views + total_bots) * 100)) if (total_views + total_bots) > 0 else 0
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{total_bots} <span style="font-size: 1rem; color: #8A8A93;">({bot_percent}%)</span></div>
                    <div class="telemetry-card-lbl">Bot Blocks</div>
                </div>
                """, unsafe_allow_html=True)
            with c4:
                # Desktop/Mobile breakdown
                total_dev = desktop_count + mobile_count + tablet_count
                mob_percent = round((mobile_count / total_dev * 100)) if total_dev > 0 else 0
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{mob_percent}%</div>
                    <div class="telemetry-card-lbl">Mobile Visitors</div>
                </div>
                """, unsafe_allow_html=True)
                
            # Helper function to render visual progress bars with gradients
            def render_bar_chart(items, title, value_suffix="", color_gradient="linear-gradient(90deg, #e10098 0%, #2979ff 100%)"):
                st.markdown(f"#### {title}")
                if not items:
                    st.info("No records found in timeframe.")
                    return
                max_val = max([item.get("count", 1) for item in items])
                for item in items:
                    name = item.get("path") or item.get("name") or item.get("country") or item.get("region") or item.get("city") or "Unknown"
                    count = item.get("count", 0)
                    fill_percent = (count / max_val * 100) if max_val > 0 else 0
                    st.markdown(f"""
                    <div class="bar-container">
                        <div class="bar-label-row">
                            <span class="bar-label">{name}</span>
                            <span class="bar-count">{count}{value_suffix}</span>
                        </div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: {fill_percent}%; background: {color_gradient} !important;"></div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

            st.markdown("---")
            
            # Split breakdowns in two columns
            col_left, col_right = st.columns(2)
            with col_left:
                popular_pages = summary_res.get("popular_pages", [])
                render_bar_chart(popular_pages, "Popular Paths / Routes", color_gradient="linear-gradient(90deg, #e10098 0%, #2979ff 100%)")
                
                st.markdown("<br>", unsafe_allow_html=True)
                top_referrers = summary_res.get("top_referrers", [])
                top_referrers = [r for r in top_referrers if r.get("name")]
                render_bar_chart(top_referrers[:6], "Top Referrers", color_gradient="linear-gradient(90deg, #e10098 0%, #2979ff 100%)")
                
            with col_right:
                top_countries = summary_res.get("countries", [])
                render_bar_chart(top_countries[:6], "Geographic - Countries", color_gradient="linear-gradient(90deg, #2979ff 0%, #00e676 100%)")
                
                st.markdown("<br>", unsafe_allow_html=True)
                top_cities = summary_res.get("cities", [])
                render_bar_chart(top_cities[:6], "Geographic - Cities", color_gradient="linear-gradient(90deg, #2979ff 0%, #00e676 100%)")
                
        # Recent logs section
        st.markdown("---")
        st.markdown("### Recent Page Visits (Last 50)")
        
        with st.spinner("Fetching latest visits..."):
            recent_visits = fetch_page_visits([('order', 'created_at.desc'), ('limit', '50')])
            
        if not recent_visits:
            st.info("No page visits found in log history.")
        else:
            headers_col = st.columns([1.5, 2, 1.2, 1.5, 1.8, 1])
            with headers_col[0]: st.markdown("**Timestamp (IST)**")
            with headers_col[1]: st.markdown("**Route**")
            with headers_col[2]: st.markdown("**Location**")
            with headers_col[3]: st.markdown("**Platform**")
            with headers_col[4]: st.markdown("**Referrer**")
            with headers_col[5]: st.markdown("**Type**")
            
            st.markdown("<hr style='margin: 8px 0; border-color: #ffffff; border-width: 1.5px;'>", unsafe_allow_html=True)
            
            for visit in recent_visits:
                timestamp_str = visit.get("created_at", "")
                ist_str = "N/A"
                if timestamp_str:
                    try:
                        clean_time_str = timestamp_str.split(".")[0].replace("Z", "")
                        if "+" in clean_time_str:
                            clean_time_str = clean_time_str.split("+")[0]
                        dt = datetime.strptime(clean_time_str, "%Y-%m-%dT%H:%M:%S")
                        ist_dt = dt + timedelta(hours=5, minutes=30)
                        ist_str = ist_dt.strftime("%b %d, %I:%M:%S %p")
                    except Exception as ex:
                        ist_str = timestamp_str[:19]
                        
                route = visit.get("path", "/")
                country = visit.get("country", "")
                city = visit.get("city", "")
                location = f"📍 {city}, {country}" if city and country else (country or "Unknown")
                
                browser = visit.get("browser", "")
                os_name = visit.get("os", "")
                platform = f"{browser} / {os_name}" if browser and os_name else (browser or os_name or "Unknown")
                
                ref = visit.get("referrer", "")
                ref_display = ref if ref else "-"
                
                is_bot = visit.get("is_bot", False)
                type_badge = '<span class="status-badge status-badge-bot">BOT</span>' if is_bot else '<span class="status-badge status-badge-user">USER</span>'
                
                row_col = st.columns([1.5, 2, 1.2, 1.5, 1.8, 1])
                with row_col[0]: st.code(ist_str)
                with row_col[1]: st.code(route)
                with row_col[2]: st.markdown(f"<span style='font-size:0.85rem;'>{location}</span>", unsafe_allow_html=True)
                with row_col[3]: st.markdown(f"<span style='font-size:0.85rem;'>{platform}</span>", unsafe_allow_html=True)
                with row_col[4]: st.markdown(f"<span style='font-size:0.85rem;'>{ref_display}</span>", unsafe_allow_html=True)
                with row_col[5]: st.markdown(type_badge, unsafe_allow_html=True)
                
                st.markdown("<hr style='margin: 4px 0; opacity: 0.15;'>", unsafe_allow_html=True)
