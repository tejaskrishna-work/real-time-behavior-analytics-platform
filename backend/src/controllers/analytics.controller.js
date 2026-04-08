import { apiResponse } from "../utils/apiResponse.js";
import {
  getOverviewAnalytics,
  getTopEventsAnalytics,
  getEventTimeseriesAnalytics,
  getDailyActiveUsersAnalytics,
  getRetentionAnalytics,
  getFunnelAnalytics,
  getSessionAnalytics,
} from "../services/analytics.service.js";

export const getOverview = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const data = await getOverviewAnalytics({
      userId: req.user._id,
      projectId,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Overview analytics fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getTopEvents = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const limit = req.query.limit || 10;

    const data = await getTopEventsAnalytics({
      userId: req.user._id,
      projectId,
      limit,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Top events fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getEventTimeseries = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const days = req.query.days || 7;

    const data = await getEventTimeseriesAnalytics({
      userId: req.user._id,
      projectId,
      days,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Event timeseries fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getDailyActiveUsers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const days = req.query.days || 7;

    const data = await getDailyActiveUsersAnalytics({
      userId: req.user._id,
      projectId,
      days,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Daily active users fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getRetention = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const days = req.query.days || 7;

    const data = await getRetentionAnalytics({
      userId: req.user._id,
      projectId,
      days,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Retention analytics fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getFunnel = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { steps } = req.body;

    const data = await getFunnelAnalytics({
      userId: req.user._id,
      projectId,
      steps,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Funnel analytics fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const data = await getSessionAnalytics({
      userId: req.user._id,
      projectId,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Session analytics fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};