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
			"/./assets/index-Jx1pIujZ.js",
			"/./assets/utils-CCpudQzd.js",
			"/./assets/api-CMCSMthc.js",
			"/./assets/dist-Cb980ft4.js",
			"/./assets/input-CTgwop21.js",
			"/./assets/QueryClientProvider-BLan6kh5.js",
			"/./assets/link-B_th97bM.js",
			"/./assets/useRouter-DCzE8IlM.js"
		],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/./assets/index-Jx1pIujZ.js"
		} }]
	},
	"/calculator": {
		filePath: "/dev-server/src/routes/calculator.tsx",
		children: void 0,
		preloads: [
			"/./assets/calculator-DRj4woQa.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/car-CkEGCpEE.js",
			"/./assets/chevron-left-BJuf3lrI.js",
			"/./assets/chevron-right-sxyjPFCz.js",
			"/./assets/pencil-owWVvox0.js",
			"/./assets/trash-2-CdJPr6b6.js",
			"/./assets/PrintDocument-BjLhx-VB.js",
			"/./assets/search-rlYIbjVT.js",
			"/./assets/useCarCustomServices-Cx2XAyPS.js",
			"/./assets/carsCatalogDb-DuS_m0uC.js"
		]
	},
	"/calendar": {
		filePath: "/dev-server/src/routes/calendar.tsx",
		children: void 0,
		preloads: [
			"/./assets/calendar-AtYC8rrK.js",
			"/./assets/useMutation-mBVbP9PK.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/badge-DPLe8ow1.js",
			"/./assets/AppointmentDialog-Dw9_vvX3.js",
			"/./assets/trash-2-CdJPr6b6.js"
		]
	},
	"/clients": {
		filePath: "/dev-server/src/routes/clients.tsx",
		children: void 0,
		preloads: [
			"/./assets/clients-j0_O9-u5.js",
			"/./assets/dropdown-menu-DwcoO4Rb.js",
			"/./assets/command-CnuFKX8s.js",
			"/./assets/useMutation-mBVbP9PK.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/arrow-left-BJuSD4-A.js",
			"/./assets/car-CkEGCpEE.js",
			"/./assets/pencil-owWVvox0.js",
			"/./assets/trash-2-CdJPr6b6.js",
			"/./assets/search-rlYIbjVT.js",
			"/./assets/ModificationForm-Cp_d42j8.js",
			"/./assets/carsCatalogDb-DuS_m0uC.js"
		]
	},
	"/expenses": {
		filePath: "/dev-server/src/routes/expenses.tsx",
		children: void 0,
		preloads: [
			"/./assets/expenses-Cg--WVOa.js",
			"/./assets/tabs-BbKbhQ2g.js",
			"/./assets/useMutation-mBVbP9PK.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/badge-DPLe8ow1.js",
			"/./assets/parseISO-BsqQyxPt.js",
			"/./assets/chevron-left-BJuf3lrI.js",
			"/./assets/chevron-right-sxyjPFCz.js",
			"/./assets/trash-2-CdJPr6b6.js",
			"/./assets/payouts-Bcg775aV.js"
		]
	},
	"/login": {
		filePath: "/dev-server/src/routes/login.tsx",
		children: void 0,
		preloads: ["/./assets/login-MyV4IFeH.js"]
	},
	"/mechanics": {
		filePath: "/dev-server/src/routes/mechanics.tsx",
		children: void 0,
		preloads: [
			"/./assets/mechanics-Bn-3R4GX.js",
			"/./assets/useMutation-mBVbP9PK.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/arrow-left-BJuSD4-A.js",
			"/./assets/calendar-clock-Bur34EKv.js",
			"/./assets/chevron-right-sxyjPFCz.js",
			"/./assets/pencil-owWVvox0.js",
			"/./assets/trash-2-CdJPr6b6.js",
			"/./assets/payouts-Bcg775aV.js"
		]
	},
	"/schedule": {
		filePath: "/dev-server/src/routes/schedule.tsx",
		children: void 0,
		preloads: [
			"/./assets/schedule-DUF9gVeo.js",
			"/./assets/dropdown-menu-DwcoO4Rb.js",
			"/./assets/useMutation-mBVbP9PK.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/badge-DPLe8ow1.js",
			"/./assets/AppointmentDialog-Dw9_vvX3.js",
			"/./assets/parseISO-BsqQyxPt.js",
			"/./assets/trash-2-CdJPr6b6.js",
			"/./assets/PrintDocument-BjLhx-VB.js"
		]
	},
	"/settings": {
		filePath: "/dev-server/src/routes/settings.tsx",
		children: void 0,
		preloads: [
			"/./assets/settings-CTq3mjz2.js",
			"/./assets/tabs-BbKbhQ2g.js",
			"/./assets/useMutation-mBVbP9PK.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/car-CkEGCpEE.js",
			"/./assets/pencil-owWVvox0.js",
			"/./assets/trash-2-CdJPr6b6.js",
			"/./assets/ModificationForm-Cp_d42j8.js",
			"/./assets/carsCatalogDb-DuS_m0uC.js"
		]
	},
	"/stats": {
		filePath: "/dev-server/src/routes/stats.tsx",
		children: void 0,
		preloads: [
			"/./assets/stats-BebPTxTN.js",
			"/./assets/useQuery-Bix_91gH.js",
			"/./assets/badge-DPLe8ow1.js",
			"/./assets/parseISO-BsqQyxPt.js",
			"/./assets/car-CkEGCpEE.js",
			"/./assets/wrench-B19Dpzu_.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
