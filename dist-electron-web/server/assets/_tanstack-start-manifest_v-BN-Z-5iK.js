//#region \0tanstack-start-manifest:v
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/dev-server/src/routes/__root.tsx",
		children: [
			"/",
			"/calculator",
			"/calendar",
			"/clients",
			"/expenses",
			"/login",
			"/mechanics",
			"/schedule",
			"/settings",
			"/stats"
		],
		css: ["/./assets/index-BmGKuEuj.css"],
		preloads: [
			"/./assets/index-Cww-Uaap.js",
			"/./assets/utils-CXOPvuNg.js",
			"/./assets/api-iRJ6C4Sa.js",
			"/./assets/dist-BorAPHrF.js",
			"/./assets/input-hVXE91Mq.js",
			"/./assets/createLucideIcon-BMdC7VzF.js",
			"/./assets/link-CytdG7Y6.js",
			"/./assets/useRouter-Ds4HpEF9.js"
		],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/./assets/index-Cww-Uaap.js"
		} }]
	},
	"/calculator": {
		filePath: "/dev-server/src/routes/calculator.tsx",
		children: void 0,
		preloads: [
			"/./assets/calculator-tl_NL94F.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/chevron-left-BqWSDjEr.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/PrintDocument-DQ2uMfl8.js",
			"/./assets/useCarCustomServices-TnDACxrL.js",
			"/./assets/carsCatalogDb-iq4162pl.js"
		]
	},
	"/calendar": {
		filePath: "/dev-server/src/routes/calendar.tsx",
		children: void 0,
		preloads: [
			"/./assets/calendar-Wru27m5t.js",
			"/./assets/useMutation-BRfikOS_.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-DXOdy74C.js",
			"/./assets/addDays-BcK341Ja.js",
			"/./assets/AppointmentDialog-BKOZ9I44.js",
			"/./assets/trash-2-CVoWsJf7.js"
		]
	},
	"/clients": {
		filePath: "/dev-server/src/routes/clients.tsx",
		children: void 0,
		preloads: [
			"/./assets/clients-DZCF7sZl.js",
			"/./assets/dropdown-menu-BJLFyssV.js",
			"/./assets/command-XbVQVq-M.js",
			"/./assets/useMutation-BRfikOS_.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/arrow-left-BiGc-5A0.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/ModificationForm-C27uDP47.js",
			"/./assets/carsCatalogDb-iq4162pl.js"
		]
	},
	"/expenses": {
		filePath: "/dev-server/src/routes/expenses.tsx",
		children: void 0,
		preloads: [
			"/./assets/expenses-Buv993hC.js",
			"/./assets/tabs-B3Oaukds.js",
			"/./assets/useMutation-BRfikOS_.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-DXOdy74C.js",
			"/./assets/addDays-BcK341Ja.js",
			"/./assets/parseISO-BMhEg8B4.js",
			"/./assets/chevron-left-BqWSDjEr.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/payouts-DQMcinMS.js"
		]
	},
	"/login": {
		filePath: "/dev-server/src/routes/login.tsx",
		children: void 0,
		preloads: ["/./assets/login-DcXAZOyW.js", "/./assets/useLoginHero-CG871O3t.js"]
	},
	"/mechanics": {
		filePath: "/dev-server/src/routes/mechanics.tsx",
		children: void 0,
		preloads: [
			"/./assets/mechanics-8H_cp2uN.js",
			"/./assets/useMutation-BRfikOS_.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/arrow-left-BiGc-5A0.js",
			"/./assets/tz-DrXDc2gz.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/payouts-DQMcinMS.js"
		]
	},
	"/schedule": {
		filePath: "/dev-server/src/routes/schedule.tsx",
		children: void 0,
		preloads: [
			"/./assets/schedule-39kWPrue.js",
			"/./assets/dropdown-menu-BJLFyssV.js",
			"/./assets/useMutation-BRfikOS_.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-DXOdy74C.js",
			"/./assets/parseISO-BMhEg8B4.js",
			"/./assets/tz-DrXDc2gz.js",
			"/./assets/AppointmentDialog-BKOZ9I44.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/PrintDocument-DQ2uMfl8.js"
		]
	},
	"/settings": {
		filePath: "/dev-server/src/routes/settings.tsx",
		children: void 0,
		preloads: [
			"/./assets/settings-DkT4TTzR.js",
			"/./assets/tabs-B3Oaukds.js",
			"/./assets/useMutation-BRfikOS_.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/useLoginHero-CG871O3t.js",
			"/./assets/ModificationForm-C27uDP47.js",
			"/./assets/carsCatalogDb-iq4162pl.js"
		]
	},
	"/stats": {
		filePath: "/dev-server/src/routes/stats.tsx",
		children: void 0,
		preloads: [
			"/./assets/stats-NjUAHnPb.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-DXOdy74C.js",
			"/./assets/parseISO-BMhEg8B4.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/wrench-CCCfFqER.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
