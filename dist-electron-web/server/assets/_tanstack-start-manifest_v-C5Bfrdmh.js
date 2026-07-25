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
			"/./assets/index-C1Hqrdku.js",
			"/./assets/utils-CXOPvuNg.js",
			"/./assets/api-H9Th6sEP.js",
			"/./assets/dist-U65BaAAg.js",
			"/./assets/input-hVXE91Mq.js",
			"/./assets/createLucideIcon-BMdC7VzF.js",
			"/./assets/link-CytdG7Y6.js",
			"/./assets/useRouter-Ds4HpEF9.js"
		],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/./assets/index-C1Hqrdku.js"
		} }]
	},
	"/calculator": {
		filePath: "/dev-server/src/routes/calculator.tsx",
		children: void 0,
		preloads: [
			"/./assets/calculator-Ct3pJEuC.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/chevron-left-BqWSDjEr.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/PrintDocument-DQ2uMfl8.js",
			"/./assets/useCarCustomServices-BEkErB8T.js",
			"/./assets/carsCatalogDb-XzFgn_lu.js"
		]
	},
	"/calendar": {
		filePath: "/dev-server/src/routes/calendar.tsx",
		children: void 0,
		preloads: [
			"/./assets/calendar-sXelX4ym.js",
			"/./assets/useMutation-CJvhKMxf.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/AppointmentDialog-Dqa9bIZf.js",
			"/./assets/trash-2-CVoWsJf7.js"
		]
	},
	"/clients": {
		filePath: "/dev-server/src/routes/clients.tsx",
		children: void 0,
		preloads: [
			"/./assets/clients-D102ILDf.js",
			"/./assets/dropdown-menu-CzJmRDYm.js",
			"/./assets/command-CxIqS-lx.js",
			"/./assets/useMutation-CJvhKMxf.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/arrow-left-BiGc-5A0.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/ModificationForm-C058S7gS.js",
			"/./assets/carsCatalogDb-XzFgn_lu.js"
		]
	},
	"/expenses": {
		filePath: "/dev-server/src/routes/expenses.tsx",
		children: void 0,
		preloads: [
			"/./assets/expenses-a6nrIPXv.js",
			"/./assets/tabs-MYn0y3g6.js",
			"/./assets/useMutation-CJvhKMxf.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/parseISO-BiH2Q19P.js",
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
		preloads: ["/./assets/login-DgDmepKK.js", "/./assets/useLoginHero-CG871O3t.js"]
	},
	"/mechanics": {
		filePath: "/dev-server/src/routes/mechanics.tsx",
		children: void 0,
		preloads: [
			"/./assets/mechanics-BHlkEIPH.js",
			"/./assets/useMutation-CJvhKMxf.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/arrow-left-BiGc-5A0.js",
			"/./assets/calendar-clock-3gWW6lDW.js",
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
			"/./assets/schedule--ZoqB974.js",
			"/./assets/dropdown-menu-CzJmRDYm.js",
			"/./assets/useMutation-CJvhKMxf.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/parseISO-BiH2Q19P.js",
			"/./assets/AppointmentDialog-Dqa9bIZf.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/PrintDocument-DQ2uMfl8.js"
		]
	},
	"/settings": {
		filePath: "/dev-server/src/routes/settings.tsx",
		children: void 0,
		preloads: [
			"/./assets/settings-Ctp6ea4b.js",
			"/./assets/tabs-MYn0y3g6.js",
			"/./assets/useMutation-CJvhKMxf.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/useLoginHero-CG871O3t.js",
			"/./assets/ModificationForm-C058S7gS.js",
			"/./assets/carsCatalogDb-XzFgn_lu.js"
		]
	},
	"/stats": {
		filePath: "/dev-server/src/routes/stats.tsx",
		children: void 0,
		preloads: [
			"/./assets/stats-Cc9L7tzr.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/parseISO-BiH2Q19P.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/wrench-CCCfFqER.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
