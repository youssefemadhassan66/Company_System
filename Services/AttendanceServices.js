// services/attendanceService.js

class AttendanceService {
  /**
   * Calculate distance between two coordinates
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(R * c)
  }

  /**
   * Validate location (only for office mode)
   */
  static validateLocation(userLocation, workLocation) {
    if (!userLocation.latitude || !userLocation.longitude) {
      return {
        valid: false,
        reason: 'Location not provided',
        distance: null,
      }
    }

    const distance = this.calculateDistance(userLocation.latitude, userLocation.longitude, workLocation.latitude, workLocation.longitude)

    const allowedRadius = workLocation.allowedRadius || 100
    const valid = distance <= allowedRadius

    return {
      valid,
      distance,
      allowedRadius,
      reason: valid ? 'Location validated successfully' : `You are ${distance}m away from ${workLocation.name} (max ${allowedRadius}m allowed)`,
    }
  }

  /**
   * Determine attendance status based on check-in time
   */
  static determineStatus(checkInTime, workSchedule = {}) {
    if (!checkInTime) return 'absent'

    const checkIn = new Date(checkInTime)
    const checkInHour = checkIn.getHours()
    const checkInMinute = checkIn.getMinutes()

    const expectedStartHour = workSchedule.startHour || 9
    const expectedStartMinute = workSchedule.startMinute || 0
    const gracePeriod = workSchedule.gracePeriod || 15

    const checkInTotalMinutes = checkInHour * 60 + checkInMinute
    const expectedTotalMinutes = expectedStartHour * 60 + expectedStartMinute
    const minutesLate = checkInTotalMinutes - expectedTotalMinutes

    if (minutesLate <= gracePeriod) {
      return 'present'
    } else if (minutesLate <= 120) {
      return 'late'
    } else {
      return 'half-day'
    }
  }

  /**
   * Process check-in
   * Supports both office and work-from-home modes
   */
  static async checkIn(data) {
    const {
      employeeId,
      latitude,
      longitude,
      workMode = 'office', // 'office' or 'work-from-home'
      workLocation = null, // Required for office mode
      workSchedule = {},
    } = data

    // Validation based on work mode
    if (workMode === 'office' && (!workLocation || !workLocation.latitude)) {
      throw new Error('Work location is required for office mode')
    }

    if (workMode === 'work-from-home' && (!latitude || !longitude)) {
      // For WFH, location is optional (but we still log it if provided)
      // Some companies may want to track general location for WFH
    }

    // Check if already checked in today
    const Attendance = require('../models/Attendance')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    })

    if (attendance?.checkIn?.time) {
      throw new Error('Already checked in today')
    }

    // Validate location ONLY for office mode
    let locationValidation = { valid: true, reason: 'Work from home - location not required' }

    if (workMode === 'office') {
      locationValidation = this.validateLocation({ latitude, longitude }, workLocation)
    }

    // Determine status based on time
    const checkInTime = new Date()
    const status = this.determineStatus(checkInTime, workSchedule)

    // Create or update attendance record
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        workMode,
      })

      // Set work location only for office mode
      if (workMode === 'office') {
        attendance.workLocation = {
          name: workLocation.name,
          latitude: workLocation.latitude,
          longitude: workLocation.longitude,
          allowedRadius: workLocation.allowedRadius || 100,
        }
      }
    }

    attendance.checkIn = {
      time: checkInTime,
      location: { latitude, longitude },
    }
    attendance.status = status

    // Set validation flags
    if (workMode === 'office') {
      attendance.isCheckInValid = locationValidation.valid
    } else {
      attendance.isCheckInValid = true // Always valid for WFH
    }

    await attendance.save()

    return {
      success: true,
      attendance,
      validation: locationValidation,
      message:
        workMode === 'work-from-home'
          ? 'Work from home check-in successful'
          : locationValidation.valid
            ? `Check-in successful at ${workLocation.name}`
            : 'Check-in recorded but location is outside allowed area',
    }
  }

  /**
   * Process check-out
   */
  static async checkOut(data) {
    const { employeeId, latitude, longitude } = data

    // Get today's attendance
    const Attendance = require('../models/Attendance')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
    })

    if (!attendance) {
      throw new Error('No check-in record found for today')
    }

    if (!attendance.checkIn?.time) {
      throw new Error('Cannot check out without checking in first')
    }

    if (attendance.checkOut?.time) {
      throw new Error('Already checked out today')
    }

    // Validate location ONLY for office mode
    let locationValidation = { valid: true, reason: 'Work from home - location not required' }

    if (attendance.workMode === 'office') {
      locationValidation = this.validateLocation({ latitude, longitude }, attendance.workLocation)
    }

    // Update attendance
    attendance.checkOut = {
      time: new Date(),
      location: { latitude, longitude },
    }

    // Set validation flags
    if (attendance.workMode === 'office') {
      attendance.isCheckOutValid = locationValidation.valid
    } else {
      attendance.isCheckOutValid = true // Always valid for WFH
    }

    await attendance.save()

    return {
      success: true,
      attendance,
      validation: locationValidation,
      workHours: attendance.workHours,
      message:
        attendance.workMode === 'work-from-home'
          ? 'Work from home check-out successful'
          : locationValidation.valid
            ? 'Check-out successful'
            : 'Check-out recorded but location is outside allowed area',
    }
  }

  /**
   * Get attendance statistics (with WFH breakdown)
   */
  static async getStats(employeeId, startDate, endDate) {
    const Attendance = require('../models/Attendance')

    const records = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    }).lean()

    const stats = {
      totalDays: records.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      totalWorkHours: 0,
      avgWorkHours: 0,
      invalidCheckIns: 0,
      invalidCheckOuts: 0,

      // WFH specific stats
      officeDays: 0,
      wfhDays: 0,
      hybridDays: 0,
    }

    records.forEach((record) => {
      // Count by status
      if (record.status === 'present') stats.present++
      else if (record.status === 'absent') stats.absent++
      else if (record.status === 'late') stats.late++
      else if (record.status === 'half-day') stats.halfDay++
      else if (record.status === 'on-leave') stats.onLeave++

      stats.totalWorkHours += record.workHours || 0

      // Count by work mode
      if (record.workMode === 'office') stats.officeDays++
      else if (record.workMode === 'work-from-home') stats.wfhDays++
      else if (record.workMode === 'hybrid') stats.hybridDays++

      // Invalid locations (only for office mode)
      if (record.workMode === 'office') {
        if (!record.isCheckInValid) stats.invalidCheckIns++
        if (!record.isCheckOutValid) stats.invalidCheckOuts++
      }
    })

    if (stats.totalDays > 0) {
      stats.avgWorkHours = Math.round((stats.totalWorkHours / stats.totalDays) * 100) / 100
    }

    return stats
  }

  /**
   * Get monthly report
   */
  static async getMonthlyReport(employeeId, year, month) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const Attendance = require('../models/Attendance')

    const records = await Attendance.getByDateRange(employeeId, startDate, endDate)
    const stats = await this.getStats(employeeId, startDate, endDate)

    return {
      period: { year, month },
      records,
      stats,
      summary: {
        totalWorkHours: stats.totalWorkHours,
        officeDays: stats.officeDays,
        wfhDays: stats.wfhDays,
        attendanceRate: stats.totalDays > 0 ? Math.round(((stats.present + stats.late) / stats.totalDays) * 100) : 0,
      },
    }
  }

  /**
   * Validate location before check-in (for office mode)
   */
  static canCheckInFromLocation(userLat, userLng, workLocation) {
    return this.validateLocation({ latitude: userLat, longitude: userLng }, workLocation)
  }
}

module.exports = AttendanceService
