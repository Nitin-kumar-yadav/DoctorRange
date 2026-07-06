import Payment from "../models/payment.model.js";
import Appointment from "../models/Appointment.model.js";
import Razorpay from "razorpay";


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createPayment = async (req, res) => {
    try {
        const loginToken = req.user?._id || req?.cookies?._id;


        if (req.user?.role !== "hospital" && req.user?.role !== "employee" && req.user?.role !== "doctor") {
            return res.status(403).json({ message: "Forbidden: Only hospitals can create appointments this way" });
        }
        const { _id: appointID } = req.params;
        const { amount, paymentMethod = "UPI" } = req.body;


        const appointment = await Appointment.findById(appointID);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment does not exist in database"
            });
        }


        if (appointment.hospitalId.toString() !== loginToken.toString()) {
            return res.status(401).json({ message: "Unauthorized access to this appointment" });
        }


        const createPaymentOrder = await razorpayInstance.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`
        });
        if (!createPaymentOrder) {
            await Payment.create({
                appointmentId: appointID,
                amount: amount,
                paymentMethod: paymentMethod,
                status: "pending"
            });
            return res.status(500).json({
                success: false,
                message: "Payment failed"
            })
        }

        const payment = new Payment({
            appointmentId: appointID,
            amount: amount,
            paymentMethod: paymentMethod,
            status: "complete",
            orderId: createPaymentOrder.id
        });


        appointment.payment = payment._id;

        await Promise.all([
            payment.save(),
            appointment.save()
        ]);


        return res.status(201).json({
            success: true,
            message: "Payment created successfully",
            createPaymentOrder
        });


    } catch (error) {
        console.error("Payment Creation Error:", error);
        res.status(500).json({ success: false, message: "Failed to create payment", error: error.message });
    }
}