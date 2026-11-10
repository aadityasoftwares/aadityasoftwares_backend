import type { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service.js";
import { ResponseUtil } from "../../utils/response.util.js";

export class DashboardController {
    private dashboardService: DashboardService;

    constructor() {
        this.dashboardService = new DashboardService();
    }

    getMetrics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const metrics = await this.dashboardService.getMetrics();
            return res.status(200).json(ResponseUtil.success("Dashboard metrics fetched successfully.", metrics));
        } catch (error) {
            next(error);
        }
    };
}

