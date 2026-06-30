import Payment from "../models/payment.model.js";
import Hospitalinfo from "../models/hospital.model.js";
import Patientinfo from "../models/patient.model.js";
import Appointment from "../models/Appointment.model.js";
import Razorpay from "razorpay";

export const createPayment = async (req, res) => {
    try {
        const loginToken = req.user?._id || req?.cookies?._id;
        if (!loginToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (req.user?.role == "hospital") {
            const user = await Hospitalinfo.findById(loginToken);
            if (!user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const patient = await Patientinfo.findById(req.body.patientId);
            if (!patient) {
                return res.status(404).json({ message: "Patient not found" });
            }
            const appointment = await Appointment.findById(patient.appointmentId);
            if (!appointment) {
                return res.status(404).json({ message: "Appointment not found" });
            }
            if (appointment.hospitalId != loginToken) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const payment = await Payment.create({
                appointmentId: appointment._id,
                amount: req.body.amount,
                paymentMethod: "",
                status: "pending"
            });
            var instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })

            const createPaymentOrder = await instance.orders.create({
                amount: Number(req.body.amount) * 100,
                currency: "INR",
                receipt: `receipt_order_${Date.now()}`
            })
            payment.orderId = createPaymentOrder.id;
            await payment.save();

            appointment.payment = payment._id;
            await appointment.save();

            return res.status(201).json({ message: "Payment created successfully", createPaymentOrder });
        }

    } catch (error) {
        res.status(500).json({ message: "Failed to create payment", error });
    }
}